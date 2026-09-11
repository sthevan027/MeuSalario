-- Faturamento mensal PJ/MEI (lançamento manual ou importado de extrato) +
-- limite anual MEI configurável via tax_config.
--
-- Contexto: evolução "de simulador para copiloto fiscal" (README) — 3
-- features: importação de extrato, DAS/DARF, alerta de teto MEI. Todas as
-- três dependem de uma mesma peça de dado que ainda não existia: o
-- faturamento real do usuário mês a mês. Esta migração cria essa base.

-- 1) Estende tax_config pra aceitar o limite anual do MEI (mesmo padrão
--    configurável já usado pra INSS/IRRF/DAS — não crava o valor no código).
alter table public.tax_config drop constraint if exists tax_config_tipo_check;
alter table public.tax_config add constraint tax_config_tipo_check
  check (tipo in (
    'inss_brackets', 'irrf_brackets', 'inss_max', 'irrf_isencao',
    'inss_pro_labore_rate', 'das_anexo_iii', 'das_anexo_v',
    'deducao_dependente', 'mei_limite_anual'
  ));

insert into public.tax_config (ano, tipo, valor) values
(2026, 'mei_limite_anual', '81000.00'::jsonb)
on conflict (ano, tipo) do nothing;

comment on constraint tax_config_tipo_check on public.tax_config is
  'Lista de tipos de configuração tributária aceitos — inclui mei_limite_anual desde 2026-09-11.';

-- 2) Faturamento mensal PJ/MEI — uma linha por usuário por competência.
--    'fonte' registra se veio de lançamento manual ou de importação de
--    extrato (CSV/OFX) — extrato é mais confiável, pode sobrescrever
--    entrada manual da mesma competência (upsert na camada de aplicação).
create table if not exists public.pj_revenue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competencia date not null, -- sempre dia 1 do mês (ex: 2026-09-01)
  valor numeric not null check (valor >= 0),
  fonte text not null default 'manual' check (fonte in ('manual', 'extrato')),
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, competencia)
);

comment on table public.pj_revenue_entries is
  'Faturamento mensal informado pelo usuário PJ/MEI — alimenta cálculo de DAS real e alerta de teto MEI. Uma linha por usuário por mês (upsert).';
comment on column public.pj_revenue_entries.competencia is 'Primeiro dia do mês de competência (ex: 2026-09-01 para setembro/2026).';
comment on column public.pj_revenue_entries.fonte is 'manual = digitado pelo usuário; extrato = importado de CSV/OFX.';

create index if not exists pj_revenue_entries_user_id_competencia_idx
  on public.pj_revenue_entries(user_id, competencia desc);

create or replace function public.set_pj_revenue_entries_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pj_revenue_entries_updated_at on public.pj_revenue_entries;
create trigger pj_revenue_entries_updated_at
  before update on public.pj_revenue_entries
  for each row execute function public.set_pj_revenue_entries_updated_at();

alter table public.pj_revenue_entries enable row level security;

drop policy if exists "pj_revenue_entries_select_own" on public.pj_revenue_entries;
create policy "pj_revenue_entries_select_own"
  on public.pj_revenue_entries for select
  using (user_id = auth.uid());

drop policy if exists "pj_revenue_entries_insert_own" on public.pj_revenue_entries;
create policy "pj_revenue_entries_insert_own"
  on public.pj_revenue_entries for insert
  with check (user_id = auth.uid());

drop policy if exists "pj_revenue_entries_update_own" on public.pj_revenue_entries;
create policy "pj_revenue_entries_update_own"
  on public.pj_revenue_entries for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "pj_revenue_entries_delete_own" on public.pj_revenue_entries;
create policy "pj_revenue_entries_delete_own"
  on public.pj_revenue_entries for delete
  using (user_id = auth.uid());

-- 3) Preferência de anexo do Simples Nacional do usuário (III ou V) — usada
--    pra calcular o DAS real a partir do faturamento sem pedir de novo a
--    cada tela. Coluna nova em profiles não entra no trigger de
--    anti-escalonamento de privilégio (só bloqueia campos listados
--    explicitamente lá), então o próprio usuário pode editar via RLS
--    "profiles_update_own" que já existe.
alter table public.profiles add column if not exists anexo_simples_nacional text
  check (anexo_simples_nacional in ('III', 'V'));
comment on column public.profiles.anexo_simples_nacional is 'Anexo do Simples Nacional do usuário PJ (III ou V) — usado no cálculo real de DAS a partir do faturamento lançado.';
