-- Permite configurar o ponto de equilíbrio da isenção do IRRF (Lei 15.270/2025)
-- sem depender do fallback hardcoded do app.

do $$
begin
  -- Atualiza o check constraint do campo tipo para aceitar a nova chave
  if exists (
    select 1
    from pg_constraint
    where conname = 'tax_config_tipo_check'
  ) then
    alter table public.tax_config drop constraint tax_config_tipo_check;
  end if;

  alter table public.tax_config
    add constraint tax_config_tipo_check
    check (
      tipo in (
        'inss_brackets',
        'irrf_brackets',
        'inss_max',
        'irrf_isencao',
        'irrf_isencao_break_even',
        'inss_pro_labore_rate',
        'das_anexo_iii',
        'das_anexo_v',
        'deducao_dependente'
      )
    ) not valid;

  alter table public.tax_config validate constraint tax_config_tipo_check;
exception
  when undefined_table then
    -- Ambientes que ainda não criaram a tabela via migrações: ignora.
    null;
end $$;

do $$
begin
  -- Mantém o comment em dia (se a tabela existir)
  if to_regclass('public.tax_config') is not null then
    comment on column public.tax_config.tipo is
      'Identificador do tipo de tabela: inss_brackets, irrf_brackets, inss_max, irrf_isencao, irrf_isencao_break_even, das_anexo_iii, das_anexo_v, deducao_dependente, inss_pro_labore_rate';
  end if;
end $$;

-- Seed 2026: ponto de equilíbrio do complemento de isenção
insert into public.tax_config (ano, tipo, valor)
values (2026, 'irrf_isencao_break_even', '7786.72'::jsonb)
on conflict (ano, tipo) do nothing;

