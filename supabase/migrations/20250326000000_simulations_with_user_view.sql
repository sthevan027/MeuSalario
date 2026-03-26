-- Migração: view simulations_with_user (idempotente)
-- Objetivo: exibir o nome do usuário (em vez do UUID user_id) na tabela
-- simulations quando visualizada no Table Editor do Supabase.
--
-- Para usar no Supabase Table Editor:
--   1. Na barra lateral, acesse "Database" → "Views"
--   2. Abra a view "simulations_with_user"
--   3. Você verá a coluna "user_name" com o nome (ou email) de cada usuário.
--
-- DROP + CREATE: CREATE OR REPLACE falha se a ordem/nome das colunas mudou em relação
-- à view já existente (ERROR 42P16: cannot change name of view column ...).

drop view if exists public.simulations_with_user;

create view public.simulations_with_user
with (security_invoker = false) as
select
  s.id,
  s.user_id,
  coalesce(p.name, p.email, s.user_id::text) as user_name,
  p.plan,
  p.role,
  s.contract_type,
  s.input_json,
  s.result_json,
  s.created_at
from public.simulations s
left join public.profiles p on p.id = s.user_id;

-- Permissão: apenas service_role pode consultar (admin da plataforma).
-- Para rodar queries no Table Editor como admin, o service_role tem acesso direto.
-- Usuários autenticados não acessam esta view via API (não há RLS grant aqui).
revoke all on public.simulations_with_user from anon, authenticated;
grant select on public.simulations_with_user to service_role;
