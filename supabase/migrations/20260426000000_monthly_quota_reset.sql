-- ============================================================
-- Quotas mensais com reset automático — Free tier redesenhado
-- ============================================================
-- Antes : quotas vitalícias (queimadas uma única vez).
-- Depois: reset no 1º dia de cada mês. O reset acontece de
--         forma lazy: quando o usuário tenta consumir qualquer
--         quota após a data de reset, todas são repostas.
--
-- Novos limites Free/mês:
--   simulations_remaining           3 → 5
--   comparisons_remaining           2   (mantém)
--   compatibility_checks_remaining  2   (mantém)
-- ============================================================

-- 1. Coluna de controle do ciclo mensal
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS quota_reset_at timestamptz;

-- 2. Restaura cotas e define próximo reset para usuários free existentes
DO $$
BEGIN
  PERFORM set_config('app.skip_profile_guard', 'on', true);

  UPDATE public.profiles
  SET
    quota_reset_at                 = date_trunc('month', now()) + interval '1 month',
    simulations_remaining          = 5,
    comparisons_remaining          = 2,
    compatibility_checks_remaining = 2
  WHERE plan = 'free';

  PERFORM set_config('app.skip_profile_guard', 'off', true);
EXCEPTION WHEN others THEN
  PERFORM set_config('app.skip_profile_guard', 'off', true);
  RAISE;
END $$;

-- 3. Atualiza app_config: simulations_limit 3 → 5
INSERT INTO public.app_config (key, value)
VALUES ('free_simulations_limit', '5'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = '5'::jsonb;

-- 4. Trigger: inclui quota_reset_at na proteção contra alteração manual
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service Role e operações internas com skip_profile_guard passam direto
  IF auth.uid() IS NULL
     OR auth.uid() <> old.id
     OR coalesce(current_setting('app.skip_profile_guard', true), '') = 'on'
  THEN
    RETURN new;
  END IF;

  IF new.simulations_remaining IS DISTINCT FROM old.simulations_remaining THEN
    RAISE EXCEPTION 'Não é permitido alterar o saldo de simulações manualmente.';
  END IF;
  IF new.comparisons_remaining IS DISTINCT FROM old.comparisons_remaining THEN
    RAISE EXCEPTION 'Não é permitido alterar o saldo de comparações manualmente.';
  END IF;
  IF new.compatibility_checks_remaining IS DISTINCT FROM old.compatibility_checks_remaining THEN
    RAISE EXCEPTION 'Não é permitido alterar o saldo de compatibilidade manualmente.';
  END IF;
  IF new.quota_reset_at IS DISTINCT FROM old.quota_reset_at THEN
    RAISE EXCEPTION 'Não é permitido alterar quota_reset_at manualmente.';
  END IF;
  IF new.role IS DISTINCT FROM old.role THEN
    RAISE EXCEPTION 'Não é permitido alterar role.';
  END IF;
  IF new.plan IS DISTINCT FROM old.plan THEN
    RAISE EXCEPTION 'Não é permitido alterar plan.';
  END IF;
  IF new.subscription_status IS DISTINCT FROM old.subscription_status THEN
    RAISE EXCEPTION 'Não é permitido alterar subscription_status.';
  END IF;
  IF new.stripe_customer_id IS DISTINCT FROM old.stripe_customer_id THEN
    RAISE EXCEPTION 'Não é permitido alterar stripe_customer_id.';
  END IF;
  IF new.stripe_subscription_id IS DISTINCT FROM old.stripe_subscription_id THEN
    RAISE EXCEPTION 'Não é permitido alterar stripe_subscription_id.';
  END IF;
  IF new.asaas_customer_id IS DISTINCT FROM old.asaas_customer_id THEN
    RAISE EXCEPTION 'Não é permitido alterar asaas_customer_id.';
  END IF;
  IF new.asaas_subscription_id IS DISTINCT FROM old.asaas_subscription_id THEN
    RAISE EXCEPTION 'Não é permitido alterar asaas_subscription_id.';
  END IF;
  IF new.email IS DISTINCT FROM old.email THEN
    RAISE EXCEPTION 'Não é permitido alterar email.';
  END IF;

  RETURN new;
END;
$$;

-- 5. handle_new_user: novos cadastros já nascem com quota_reset_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sim   int;
  v_comp  int;
  v_compat int;
BEGIN
  SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 5) INTO v_sim
    FROM public.app_config WHERE key = 'free_simulations_limit';
  SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_comp
    FROM public.app_config WHERE key = 'free_comparisons_limit';
  SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_compat
    FROM public.app_config WHERE key = 'free_compatibility_limit';

  IF v_sim   IS NULL OR v_sim   < 1 THEN v_sim   := 5; END IF;
  IF v_comp  IS NULL OR v_comp  < 1 THEN v_comp  := 2; END IF;
  IF v_compat IS NULL OR v_compat < 1 THEN v_compat := 2; END IF;

  INSERT INTO public.profiles (
    id, email, name, role,
    simulations_remaining, comparisons_remaining, compatibility_checks_remaining,
    quota_reset_at
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user',
    v_sim, v_comp, v_compat,
    date_trunc('month', now()) + interval '1 month'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = excluded.email,
    name  = excluded.name;

  RETURN new;
END;
$$;

-- ============================================================
-- 6. try_consume_simulation com reset mensal automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.try_consume_simulation()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_plan     text;
  v_remaining int;
  v_reset_at timestamptz;
  v_sim_limit  int;
  v_comp_limit int;
  v_compat_limit int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT plan, simulations_remaining, quota_reset_at
  INTO v_plan, v_remaining, v_reset_at
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_plan = 'pro' THEN
    RETURN jsonb_build_object('ok', true, 'remaining', null, 'unlimited', true);
  END IF;

  -- Reset mensal lazy: repõe todas as quotas quando o período expirou
  IF v_reset_at IS NULL OR now() >= v_reset_at THEN
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 5) INTO v_sim_limit
      FROM public.app_config WHERE key = 'free_simulations_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_comp_limit
      FROM public.app_config WHERE key = 'free_comparisons_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_compat_limit
      FROM public.app_config WHERE key = 'free_compatibility_limit';

    IF v_sim_limit   IS NULL OR v_sim_limit   < 1 THEN v_sim_limit   := 5; END IF;
    IF v_comp_limit  IS NULL OR v_comp_limit  < 1 THEN v_comp_limit  := 2; END IF;
    IF v_compat_limit IS NULL OR v_compat_limit < 1 THEN v_compat_limit := 2; END IF;

    PERFORM set_config('app.skip_profile_guard', 'on', true);
    UPDATE public.profiles
    SET
      simulations_remaining          = v_sim_limit,
      comparisons_remaining          = v_comp_limit,
      compatibility_checks_remaining = v_compat_limit,
      quota_reset_at                 = date_trunc('month', now()) + interval '1 month'
    WHERE id = v_uid;
    PERFORM set_config('app.skip_profile_guard', 'off', true);

    v_remaining := v_sim_limit;
  END IF;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED', 'remaining', 0);
  END IF;

  PERFORM set_config('app.skip_profile_guard', 'on', true);
  UPDATE public.profiles
  SET simulations_remaining = simulations_remaining - 1
  WHERE id = v_uid
  RETURNING simulations_remaining INTO v_remaining;
  PERFORM set_config('app.skip_profile_guard', 'off', true);

  RETURN jsonb_build_object('ok', true, 'remaining', v_remaining, 'unlimited', false);
EXCEPTION WHEN others THEN
  PERFORM set_config('app.skip_profile_guard', 'off', true);
  RAISE;
END;
$$;

-- ============================================================
-- 7. try_consume_comparison com reset mensal automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.try_consume_comparison()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_plan     text;
  v_remaining int;
  v_reset_at timestamptz;
  v_sim_limit  int;
  v_comp_limit int;
  v_compat_limit int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT plan, comparisons_remaining, quota_reset_at
  INTO v_plan, v_remaining, v_reset_at
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_plan = 'pro' THEN
    RETURN jsonb_build_object('ok', true, 'remaining', null, 'unlimited', true);
  END IF;

  IF v_reset_at IS NULL OR now() >= v_reset_at THEN
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 5) INTO v_sim_limit
      FROM public.app_config WHERE key = 'free_simulations_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_comp_limit
      FROM public.app_config WHERE key = 'free_comparisons_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_compat_limit
      FROM public.app_config WHERE key = 'free_compatibility_limit';

    IF v_sim_limit   IS NULL OR v_sim_limit   < 1 THEN v_sim_limit   := 5; END IF;
    IF v_comp_limit  IS NULL OR v_comp_limit  < 1 THEN v_comp_limit  := 2; END IF;
    IF v_compat_limit IS NULL OR v_compat_limit < 1 THEN v_compat_limit := 2; END IF;

    PERFORM set_config('app.skip_profile_guard', 'on', true);
    UPDATE public.profiles
    SET
      simulations_remaining          = v_sim_limit,
      comparisons_remaining          = v_comp_limit,
      compatibility_checks_remaining = v_compat_limit,
      quota_reset_at                 = date_trunc('month', now()) + interval '1 month'
    WHERE id = v_uid;
    PERFORM set_config('app.skip_profile_guard', 'off', true);

    v_remaining := v_comp_limit;
  END IF;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED', 'remaining', 0);
  END IF;

  PERFORM set_config('app.skip_profile_guard', 'on', true);
  UPDATE public.profiles
  SET comparisons_remaining = comparisons_remaining - 1
  WHERE id = v_uid
  RETURNING comparisons_remaining INTO v_remaining;
  PERFORM set_config('app.skip_profile_guard', 'off', true);

  RETURN jsonb_build_object('ok', true, 'remaining', v_remaining, 'unlimited', false);
EXCEPTION WHEN others THEN
  PERFORM set_config('app.skip_profile_guard', 'off', true);
  RAISE;
END;
$$;

-- ============================================================
-- 8. try_consume_compatibility com reset mensal automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.try_consume_compatibility()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_plan     text;
  v_remaining int;
  v_reset_at timestamptz;
  v_sim_limit  int;
  v_comp_limit int;
  v_compat_limit int;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'UNAUTHORIZED');
  END IF;

  SELECT plan, compatibility_checks_remaining, quota_reset_at
  INTO v_plan, v_remaining, v_reset_at
  FROM public.profiles
  WHERE id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  IF v_plan = 'pro' THEN
    RETURN jsonb_build_object('ok', true, 'remaining', null, 'unlimited', true);
  END IF;

  IF v_reset_at IS NULL OR now() >= v_reset_at THEN
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 5) INTO v_sim_limit
      FROM public.app_config WHERE key = 'free_simulations_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_comp_limit
      FROM public.app_config WHERE key = 'free_comparisons_limit';
    SELECT coalesce(nullif(trim(value #>> '{}'), '')::int, 2) INTO v_compat_limit
      FROM public.app_config WHERE key = 'free_compatibility_limit';

    IF v_sim_limit   IS NULL OR v_sim_limit   < 1 THEN v_sim_limit   := 5; END IF;
    IF v_comp_limit  IS NULL OR v_comp_limit  < 1 THEN v_comp_limit  := 2; END IF;
    IF v_compat_limit IS NULL OR v_compat_limit < 1 THEN v_compat_limit := 2; END IF;

    PERFORM set_config('app.skip_profile_guard', 'on', true);
    UPDATE public.profiles
    SET
      simulations_remaining          = v_sim_limit,
      comparisons_remaining          = v_comp_limit,
      compatibility_checks_remaining = v_compat_limit,
      quota_reset_at                 = date_trunc('month', now()) + interval '1 month'
    WHERE id = v_uid;
    PERFORM set_config('app.skip_profile_guard', 'off', true);

    v_remaining := v_compat_limit;
  END IF;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'QUOTA_EXCEEDED', 'remaining', 0);
  END IF;

  PERFORM set_config('app.skip_profile_guard', 'on', true);
  UPDATE public.profiles
  SET compatibility_checks_remaining = compatibility_checks_remaining - 1
  WHERE id = v_uid
  RETURNING compatibility_checks_remaining INTO v_remaining;
  PERFORM set_config('app.skip_profile_guard', 'off', true);

  RETURN jsonb_build_object('ok', true, 'remaining', v_remaining, 'unlimited', false);
EXCEPTION WHEN others THEN
  PERFORM set_config('app.skip_profile_guard', 'off', true);
  RAISE;
END;
$$;

-- Grants (idempotent)
GRANT EXECUTE ON FUNCTION public.try_consume_simulation()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_comparison()    TO authenticated;
GRANT EXECUTE ON FUNCTION public.try_consume_compatibility() TO authenticated;
