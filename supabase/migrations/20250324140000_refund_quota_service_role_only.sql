-- Segurança (P1): estorno não pode ser invocado por clients autenticados para "mintar" créditos.
-- Somente service_role (chave do servidor) pode chamar; usuário alvo vem por parâmetro.

drop function if exists public.refund_simulation_quota();

create or replace function public.refund_simulation_quota(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  if coalesce(auth.jwt()->>'role', '') is distinct from 'service_role' then
    raise exception 'forbidden';
  end if;

  if p_user_id is null then
    return;
  end if;

  select plan into v_plan from public.profiles where id = p_user_id;
  if v_plan = 'pro' or v_plan is null then
    return;
  end if;

  perform set_config('app.skip_profile_guard', 'on', true);
  update public.profiles
  set simulations_remaining = simulations_remaining + 1
  where id = p_user_id;
  perform set_config('app.skip_profile_guard', 'off', true);
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

revoke all on function public.refund_simulation_quota(uuid) from public;
revoke all on function public.refund_simulation_quota(uuid) from anon;
revoke all on function public.refund_simulation_quota(uuid) from authenticated;
grant execute on function public.refund_simulation_quota(uuid) to service_role;
