-- Controle de uso: simulações no plano FREE + RPC atômica
-- Rode no SQL Editor do Supabase ou via CLI após revisar.

-- Configuração global (limite inicial para novos usuários FREE)
create table if not exists public.app_config (
  key text primary key,
  value jsonb not null
);

alter table public.app_config enable row level security;

drop policy if exists "app_config_select_authenticated" on public.app_config;
create policy "app_config_select_authenticated"
  on public.app_config
  for select
  to authenticated
  using (true);

insert into public.app_config (key, value)
values ('free_simulations_limit', '3'::jsonb)
on conflict (key) do nothing;

-- Saldo de simulações (FREE e créditos avulsos futuros)
alter table public.profiles add column if not exists simulations_remaining integer;

update public.profiles
set simulations_remaining = coalesce(simulations_remaining, 3)
where simulations_remaining is null;

alter table public.profiles
  alter column simulations_remaining set not null;

alter table public.profiles
  alter column simulations_remaining set default 3;

-- Novo usuário: limite configurável em app_config
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int;
begin
  select coalesce(nullif(trim(value #>> '{}'), '')::int, 3) into v_limit
  from public.app_config
  where key = 'free_simulations_limit';

  if v_limit is null then
    v_limit := 3;
  end if;

  insert into public.profiles (id, email, name, role, simulations_remaining)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user',
    v_limit
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;

  return new;
end;
$$;

-- Impede alteração manual de simulations_remaining; permite via RPC (session var)
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

-- Consome 1 simulação (FREE); PRO não decrementa
create or replace function public.try_consume_simulation()
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

  select plan, simulations_remaining
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
  set simulations_remaining = simulations_remaining - 1
  where id = v_uid
  returning simulations_remaining into v_remaining;

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

-- Estorno se insert da simulação falhar após consumo
create or replace function public.refund_simulation_quota()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan text;
begin
  if v_uid is null then
    return;
  end if;

  select plan into v_plan from public.profiles where id = v_uid;
  if v_plan = 'pro' or v_plan is null then
    return;
  end if;

  perform set_config('app.skip_profile_guard', 'on', true);
  update public.profiles
  set simulations_remaining = simulations_remaining + 1
  where id = v_uid;
  perform set_config('app.skip_profile_guard', 'off', true);
exception
  when others then
    perform set_config('app.skip_profile_guard', 'off', true);
    raise;
end;
$$;

grant execute on function public.try_consume_simulation() to authenticated;
grant execute on function public.refund_simulation_quota() to authenticated;
