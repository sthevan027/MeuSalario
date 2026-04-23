-- Tabela de configuração de tabelas tributárias por ano
-- Permite atualizar INSS/IRRF/DAS sem necessidade de novo deploy

create table if not exists public.tax_config (
  id uuid primary key default gen_random_uuid(),
  ano integer not null,
  tipo text not null check (tipo in ('inss_brackets', 'irrf_brackets', 'inss_max', 'irrf_isencao', 'inss_pro_labore_rate', 'das_anexo_iii', 'das_anexo_v', 'deducao_dependente')),
  valor jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (ano, tipo)
);

comment on table public.tax_config is 'Tabelas tributárias configuráveis por ano (INSS, IRRF, DAS). Permite atualizar alíquotas sem deploy.';
comment on column public.tax_config.tipo is 'Identificador do tipo de tabela: inss_brackets, irrf_brackets, inss_max, irrf_isencao, das_anexo_iii, das_anexo_v, deducao_dependente, inss_pro_labore_rate';
comment on column public.tax_config.valor is 'Valor da configuração em JSON. Para brackets: array de {limit, rate}. Para scalars: number.';

-- Trigger para updated_at automático
create or replace function public.set_tax_config_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tax_config_updated_at on public.tax_config;
create trigger tax_config_updated_at
  before update on public.tax_config
  for each row execute function public.set_tax_config_updated_at();

-- RLS: somente admins e service role podem escrever; leitura pública
alter table public.tax_config enable row level security;

drop policy if exists "tax_config_select_all" on public.tax_config;
create policy "tax_config_select_all"
  on public.tax_config for select
  using (true);

drop policy if exists "tax_config_write_admin" on public.tax_config;
create policy "tax_config_write_admin"
  on public.tax_config for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed: valores 2026 (espelha os valores hardcoded em tax.ts)
insert into public.tax_config (ano, tipo, valor) values
(2026, 'inss_brackets', '[
  {"limit": 1621.00, "rate": 0.075},
  {"limit": 2902.84, "rate": 0.09},
  {"limit": 4354.27, "rate": 0.12},
  {"limit": 8475.55, "rate": 0.14}
]'::jsonb),
(2026, 'inss_max', '988.10'::jsonb),
(2026, 'irrf_brackets', '[
  {"limit": 2428.80, "rate": 0, "deduction": 0},
  {"limit": 2826.65, "rate": 0.075, "deduction": 182.16},
  {"limit": 3751.05, "rate": 0.15, "deduction": 394.16},
  {"limit": 4664.68, "rate": 0.225, "deduction": 675.49},
  {"limit": null, "rate": 0.275, "deduction": 908.73}
]'::jsonb),
(2026, 'irrf_isencao', '5000.00'::jsonb),
(2026, 'deducao_dependente', '189.59'::jsonb),
(2026, 'inss_pro_labore_rate', '0.11'::jsonb),
(2026, 'das_anexo_iii', '[
  {"limiteAnual": 180000, "aliquota": 0.06, "deducao": 0},
  {"limiteAnual": 360000, "aliquota": 0.112, "deducao": 9360},
  {"limiteAnual": 720000, "aliquota": 0.135, "deducao": 17640},
  {"limiteAnual": 1800000, "aliquota": 0.16, "deducao": 35640},
  {"limiteAnual": 3600000, "aliquota": 0.21, "deducao": 125640},
  {"limiteAnual": 4800000, "aliquota": 0.33, "deducao": 648000}
]'::jsonb),
(2026, 'das_anexo_v', '[
  {"limiteAnual": 180000, "aliquota": 0.155, "deducao": 0},
  {"limiteAnual": 360000, "aliquota": 0.18, "deducao": 4500},
  {"limiteAnual": 720000, "aliquota": 0.195, "deducao": 9900},
  {"limiteAnual": 1800000, "aliquota": 0.205, "deducao": 17100},
  {"limiteAnual": 3600000, "aliquota": 0.23, "deducao": 62100},
  {"limiteAnual": 4800000, "aliquota": 0.305, "deducao": 540000}
]'::jsonb)
on conflict (ano, tipo) do nothing;
