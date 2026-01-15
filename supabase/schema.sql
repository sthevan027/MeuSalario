-- Schema inicial do MeuSalario (MVP)
-- Rode este arquivo no SQL Editor do Supabase.

-- Extensões úteis
create extension if not exists "pgcrypto";

-- PERFIS (um-para-um com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  plan text not null default 'free' check (plan in ('free','pro')),
  role text not null default 'user' check (role in ('user','admin')),
  subscription_status text not null default 'none'
    check (subscription_status in ('active','trialing','past_due','canceled','none')),
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

-- Migrações idempotentes (para quem rodou versões antigas do schema)
alter table public.profiles add column if not exists name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists plan text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists subscription_status text;
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists created_at timestamptz;

-- SIMULAÇÕES
create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contract_type text not null check (contract_type in ('clt','pj')),
  input_json jsonb not null,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists simulations_user_id_created_at_idx
  on public.simulations(user_id, created_at desc);

-- PLANOS (simples para o MVP; Stripe é a fonte de verdade do preço)
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price_monthly numeric,
  price_yearly numeric,
  trial_days integer default 0,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

-- Trigger: criar profile automaticamente ao cadastrar no Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', 'user')
  on conflict (id) do update set 
    email = excluded.email,
    name = excluded.name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.simulations enable row level security;
alter table public.plans enable row level security;

-- Policies: profiles (usuário vê/edita apenas o próprio)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Bloqueia escalonamento de privilégio via RLS (ex.: usuário mudar plan/role/manualmente).
-- Service Role (webhook/admin) não tem auth.uid(), então não é afetado.
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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
    if new.email is distinct from old.email then
      raise exception 'Não é permitido alterar email.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_privilege_escalation on public.profiles;
create trigger prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_profile_privilege_escalation();

-- Garantias para role (idempotente): default + valores nulos
do $$
begin
  begin
    alter table public.profiles alter column role set default 'user';
  exception when others then
    -- ignora (ex.: coluna inexistente em runs antigos)
  end;

  update public.profiles set role = 'user' where role is null;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
  ) then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('user','admin')) not valid;
    alter table public.profiles validate constraint profiles_role_check;
  end if;
end $$;

-- Policies: simulations (usuário vê/cria apenas as próprias)
drop policy if exists "simulations_select_own" on public.simulations;
create policy "simulations_select_own"
  on public.simulations
  for select
  using (user_id = auth.uid());

drop policy if exists "simulations_insert_own" on public.simulations;
create policy "simulations_insert_own"
  on public.simulations
  for insert
  with check (user_id = auth.uid());

drop policy if exists "simulations_delete_own" on public.simulations;
create policy "simulations_delete_own"
  on public.simulations
  for delete
  using (user_id = auth.uid());

-- Policies: plans (público pode ler)
drop policy if exists "plans_select_all" on public.plans;
create policy "plans_select_all"
  on public.plans
  for select
  using (true);

-- Migração: adicionar coluna trial_days se não existir
alter table public.plans add column if not exists trial_days integer default 0;

-- Dados iniciais: planos Free e Pro
insert into public.plans (id, name, price_monthly, price_yearly, trial_days, features, active)
values
  (
    'free',
    'Free',
    0,
    0,
    0,
    '{
      "simulation": true,
      "dashboard": false,
      "charts": false,
      "history": false,
      "comparison": false,
      "termination": false,
      "export": false
    }'::jsonb,
    true
  ),
  (
    'pro',
    'Pro',
    5.50,
    55.00,
    0,
    '{
      "simulation": true,
      "dashboard": true,
      "charts": true,
      "history": true,
      "comparison": true,
      "termination": true,
      "export": true
    }'::jsonb,
    true
  )
on conflict (id) do update
set
  name = excluded.name,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  trial_days = excluded.trial_days,
  features = excluded.features,
  active = excluded.active;