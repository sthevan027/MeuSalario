-- Auditoria de RLS: adiciona policies faltantes e documenta o modelo de segurança.
--
-- Modelo multi-tenant:
--   - Usuários acessam apenas seus próprios dados (auth.uid() = user_id / id)
--   - Service role (webhooks/admin) bypassa RLS por design do Supabase
--   - Trigger prevent_profile_privilege_escalation bloqueia alterações de campos sensíveis por usuários autenticados
--   - Funções de cota (try_consume_*, refund_quota) usam security definer + set_config para bypass controlado

-- ─── simulations: adiciona UPDATE policy ausente ───────────────────────────
-- SELECT, INSERT e DELETE já existiam; UPDATE estava faltando.
-- Usuários PRO não editam simulações diretamente, mas a policy garante que
-- qualquer futura funcionalidade de edição seja igualmente isolada.
drop policy if exists "simulations_update_own" on public.simulations;
create policy "simulations_update_own"
  on public.simulations
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── profiles: adiciona INSERT policy para cadastro via trigger ─────────────
-- O trigger handle_new_user() roda como security definer (service role),
-- portanto a policy não é necessária para o fluxo normal.
-- Adicionamos explicitamente para documentar intenção e bloquear inserts diretos
-- de usuários autenticados (cada usuário só pode ter um perfil: o seu próprio).
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (id = auth.uid());

-- ─── plans: sem alteração ───────────────────────────────────────────────────
-- plans_select_all: leitura pública (sem autenticação) — intencional para pricing page.
-- Escrita em plans requer service_role (admin API).

-- ─── app_config: sem alteração ─────────────────────────────────────────────
-- app_config_select_authenticated: leitura para usuários autenticados — intencional.
-- Escrita requer service_role.

-- ─── Revoga grants desnecessários no schema public ─────────────────────────
-- Por padrão o Supabase revoga CREATE no schema public, mas garantimos aqui.
revoke create on schema public from public;
revoke create on schema public from anon;
revoke create on schema public from authenticated;
