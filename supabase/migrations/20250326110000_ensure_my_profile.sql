-- Garante linha em public.profiles para quem já existe em auth.users mas ficou sem perfil
-- (ex.: falha antiga no trigger, conta criada antes da migração). Evita loop login → dashboard → clear-session.

create or replace function public.ensure_my_profile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sim int;
  v_comp int;
  v_compat int;
  u record;
begin
  if v_uid is null then
    return;
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    return;
  end if;

  select id, email, raw_user_meta_data into u from auth.users where id = v_uid;
  if not found then
    return;
  end if;

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
    u.id,
    u.email,
    u.raw_user_meta_data->>'name',
    'user',
    v_sim,
    v_comp,
    v_compat
  )
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_my_profile() to authenticated;
