-- Cotas FREE separadas: simulações (histórico), comparações CLT×PJ, compatibilidade salarial
-- Substitui estorno único por refund_quota(user_id, kind).

insert into public.app_config (key, value)
values
  ('free_comparisons_limit', '2'::jsonb),
  ('free_compatibility_limit', '2'::jsonb)
on conflict (key) do nothing;

alter table public.profiles add column if not exists comparisons_remaining integer;
alter table public.profiles add column if not exists compatibility_checks_remaining integer;

update public.profiles
set
  comparisons_remaining = coalesce(comparisons_remaining, 2),
  compatibility_checks_remaining = coalesce(compatibility_checks_remaining, 2)
where comparisons_remaining is null or compatibility_checks_remaining is null;

alter table public.profiles alter column comparisons_remaining set default 2;
alter table public.profiles alter column compatibility_checks_remaining set default 2;

do $$
begin
  alter table public.profiles alter column comparisons_remaining set not null;
exception when others then null;
end $$;

do $$
begin
  alter table public.profiles alter column compatibility_checks_remaining set not null;
exception when others then null;
end $$;

-- Trigger: bloquear alteração manual das novas cotas
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.simulations_remaining is distinct from old.simulations_remaining then
    if coalesce(current_setting('app.skip_profile_guard', true), '') <> 'on'
       and auth.uid() is not null
       and auth.uid() = old.id then
      raise exception 'Não é permitido alterar o saldo de simulações manualmente.';
    end if;
  end if;

  if new.comparisons_remaining is distinct from old.comparisons_remaining then
    if coalesce(current_setting('app.skip_profile_guard', true), '') <> 'on'
       and auth.uid() is not null
       and auth.uid() = old.id then
      raise exception 'Não é permitido alterar o saldo de comparações manualmente.';
    end if;
  end if;

  if new.compatibility_checks_remaining is distinct from old.compatibility_checks_remaining then
    if coalesce(current_setting('app.skip_profile_guard', true), '') <> 'on'
       and auth.uid() is not null
       and auth.uid() = old.id then
      raise exception 'Não é permitido alterar o saldo de compatibilidade manualmente.';
    end if;
  end if;

  if auth.uid() is not null and auth.uid() = old.id then
    if new.role is distinct from old.role then
      raise exception 'Não é permitido alterar role.';
    end if;
    if new.plan is distinct from old.plan then
      raise exception 'Não é permitido alterar plan.';
    end if;
    if new.subscription_status is distinct from old.subscription_status then
      raise exception 'Não é permitido alterar subscription_status.';
    end if;
    if new.stripe_customer_id is distinct from old.stripe_customer_id then
      raise exception 'Não é permitido alterar stripe_customer_id.';
    end if;
    if new.stripe_subscription_id is distinct from old.stripe_subscription_id then
      raise exception 'Não é permitido alterar stripe_subscription_id.';
    end if;
    if new.asaas_customer_id is distinct from old.asaas_customer_id then
      raise exception 'Não é permitido alterar asaas_customer_id.';
    end if;
    if new.asaas_subscription_id is distinct from old.asaas_subscription_id then
      raise exception 'Não é permitido alterar asaas_subscription_id.';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Não é permitido alterar email.';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sim int;
  v_comp int;
  v_compat int;
begin
  select coalesce(nullif(trim(value #>> '{}'), '')::int, 3) into v_sim
  from public.app_config where key = 'free_simulations_limit';
  select coalesce(nullif(trim(value #>> '{}'), '')::int, 2) into v_comp
  from public.app_config where key = 'free_comparisons_limit';
  select coalesce(nullif(trim(value #>> '{}'), '')::int, 2) into v_compat
  from public.app_config where key = 'free_compatibility_limit';

  if v_sim is null then v_sim := 3; end if;
  if v_comp is null then v_comp := 2; end if;
  if v_compat is null then v_compat := 2; end if;

  insert into public.profiles (
    id, email, name, role,
    simulations_remaining, comparisons_remaining, compatibility_checks_remaining
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user',
    v_sim,
    v_comp,
    v_compat
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  return new;
end;
$$;

create or replace function public.try_consume_comparison()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
  v_remaining int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  end if;

  select plan, comparisons_remaining
  into v_plan, v_remaining
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  end if;

  if v_plan = 'pro' then
    return jsonb_build_object('ok', true, 'remaining', null, 'unlimited', true);
  end if;

  if v_remaining <= 0 then
    return jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED', 'remaining', 0);
  end if;

  perform set_config('app.skip_profile_guard', 'on', true);

  update public.profiles
  set comparisons_remaining = comparisons_remaining - 1
  where id = v_uid
  returning comparisons_remaining into v_remaining;

  perform set_config('app.skip_profile_guard', 'off', true);

  return jsonb_build_object(
    'ok', true,
    'remaining', v_remaining,
    'unlimited', false
  );
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

create or replace function public.try_consume_compatibility()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
  v_remaining int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  end if;

  select plan, compatibility_checks_remaining
  into v_plan, v_remaining
  from public.profiles
  where id = v_uid
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  end if;

  if v_plan = 'pro' then
    return jsonb_build_object('ok', true, 'remaining', null, 'unlimited', true);
  end if;

  if v_remaining <= 0 then
    return jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED', 'remaining', 0);
  end if;

  perform set_config('app.skip_profile_guard', 'on', true);

  update public.profiles
  set compatibility_checks_remaining = compatibility_checks_remaining - 1
  where id = v_uid
  returning compatibility_checks_remaining into v_remaining;

  perform set_config('app.skip_profile_guard', 'off', true);

  return jsonb_build_object(
    'ok', true,
    'remaining', v_remaining,
    'unlimited', false
  );
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

drop function if exists public.refund_simulation_quota(uuid);

create or replace function public.refund_quota(p_user_id uuid, p_kind text)
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

  if p_user_id is null or p_kind is null then
    return;
  end if;

  if p_kind not in ('simulation', 'comparison', 'compatibility') then
    raise exception 'invalid kind';
  end if;

  select plan into v_plan from public.profiles where id = p_user_id;
  if v_plan = 'pro' or v_plan is null then
    return;
  end if;

  perform set_config('app.skip_profile_guard', 'on', true);

  if p_kind = 'simulation' then
    update public.profiles
    set simulations_remaining = simulations_remaining + 1
    where id = p_user_id;
  elsif p_kind = 'comparison' then
    update public.profiles
    set comparisons_remaining = comparisons_remaining + 1
    where id = p_user_id;
  else
    update public.profiles
    set compatibility_checks_remaining = compatibility_checks_remaining + 1
    where id = p_user_id;
  end if;

  perform set_config('app.skip_profile_guard', 'off', true);
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

revoke all on function public.refund_quota(uuid, text) from public;
revoke all on function public.refund_quota(uuid, text) from anon;
revoke all on function public.refund_quota(uuid, text) from authenticated;
grant execute on function public.refund_quota(uuid, text) to service_role;

grant execute on function public.try_consume_comparison() to authenticated;
grant execute on function public.try_consume_compatibility() to authenticated;
