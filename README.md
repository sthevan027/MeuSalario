# MeuSalario

Plataforma web para **previsão salarial**, simulações e dashboards (CLT/PJ), com **Supabase** (Auth/DB) e **Asaas** (assinatura Pro).

## Rodar local

Instalar deps:

```bash
pnpm install
```

Configurar variáveis:

- Copie `env.example` → `.env.local`
- Preencha:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (necessária para webhook Asaas/admin)
  - Asaas: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_ENV` (sandbox ou production)

Para acessar `/admin`, defina no Supabase o cargo do seu usuário:

```sql
update public.profiles
set role = 'admin'
where email = 'SEU_EMAIL_AQUI';
```

Subir o app:

```bash
pnpm dev
```

## Supabase (schema + RLS)

Rode o SQL do arquivo:

- `supabase/schema.sql`

Isso cria:
- `profiles` (1-para-1 com `auth.users`)
- `simulations`
- `plans`
- trigger de criação de profile
- RLS básico

## Asaas

1. Crie uma conta no [Asaas](https://www.asaas.com/) (sandbox ou produção).
2. Obtenha sua `ASAAS_API_KEY` no painel.
3. Configure o webhook no painel do Asaas apontando para:
   - `https://seu-dominio.com/api/billing/webhook`
4. Defina o token do webhook em `ASAAS_WEBHOOK_TOKEN` (pode ser qualquer string segura).
5. Configure `ASAAS_ENV=sandbox` para testes ou `ASAAS_ENV=production` para produção.

Os preços dos planos são definidos na tabela `plans` do Supabase e sincronizados automaticamente com o Asaas.

