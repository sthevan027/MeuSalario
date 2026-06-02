-- Habilita pg_cron para agendamento de reset mensal de cotas FREE.
-- Requer extensão pg_cron ativada no painel do Supabase (Database → Extensions).

create extension if not exists pg_cron with schema pg_catalog;

-- Garante que o cron schema tem permissões adequadas
grant usage on schema cron to postgres;

-- Função que reseta cotas de todos os usuários FREE para os limites configurados em app_config
create or replace function public.reset_free_user_quotas()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sim  int;
  v_comp int;
  v_compat int;
begin
  select coalesce(nullif(trim(value #>> '{}'), '')::int, 3) into v_sim
  from public.app_config where key = 'free_simulations_limit';

  select coalesce(nullif(trim(value #>> '{}'), '')::int, 2) into v_comp
  from public.app_config where key = 'free_comparisons_limit';

  select coalesce(nullif(trim(value #>> '{}'), '')::int, 2) into v_compat
  from public.app_config where key = 'free_compatibility_limit';

  if v_sim   is null then v_sim   := 3; end if;
  if v_comp  is null then v_comp  := 2; end if;
  if v_compat is null then v_compat := 2; end if;

  -- Bypassa o trigger prevent_profile_privilege_escalation (service_role não tem auth.uid(), mas por segurança)
  perform set_config('app.skip_profile_guard', 'on', true);

  update public.profiles
  set
    simulations_remaining          = v_sim,
    comparisons_remaining          = v_comp,
    compatibility_checks_remaining = v_compat
  where plan = 'free';

  perform set_config('app.skip_profile_guard', 'off', true);
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

-- Revoga acesso público à função (apenas service_role e postgres via cron)
revoke all on function public.reset_free_user_quotas() from public;
revoke all on function public.reset_free_user_quotas() from anon;
revoke all on function public.reset_free_user_quotas() from authenticated;
grant execute on function public.reset_free_user_quotas() to service_role;

-- Remove job anterior caso exista (idempotente)
select cron.unschedule('reset-free-quotas')
where exists (select 1 from cron.job where jobname = 'reset-free-quotas');

-- Agenda reset no 1º dia de cada mês às 00:00 UTC
select cron.schedule(
  'reset-free-quotas',
  '0 0 1 * *',
  $$ select public.reset_free_user_quotas() $$
);
