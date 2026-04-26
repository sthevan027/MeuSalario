-- Adiciona irrf_isencao_break_even à tabela tax_config
-- Necessário para o complemento de isenção do IRRF 2026 (Lei 15.270/2025):
-- ponto de equilíbrio onde o complemento de isenção gradual chega a zero (~R$ 7.786,72)

-- Recria a constraint de tipo para incluir o novo campo
alter table public.tax_config
  drop constraint if exists tax_config_tipo_check;

alter table public.tax_config
  add constraint tax_config_tipo_check check (
    tipo in (
      'inss_brackets',
      'irrf_brackets',
      'inss_max',
      'irrf_isencao',
      'irrf_isencao_break_even',
      'deducao_dependente',
      'inss_pro_labore_rate',
      'das_anexo_iii',
      'das_anexo_v'
    )
  );

-- Seed: valor 2026 (espelha o fallback em tax-config.ts)
insert into public.tax_config (ano, tipo, valor)
values (2026, 'irrf_isencao_break_even', '7786.72'::jsonb)
on conflict (ano, tipo) do nothing;
