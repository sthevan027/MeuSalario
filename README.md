# MeuSalario

Plataforma web para **previsão salarial**, simulações e dashboards (CLT/PJ), com **Supabase** (Auth/DB) e **Stripe** (assinatura Pro).

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
  - `SUPABASE_SERVICE_ROLE_KEY` (necessária para webhook Stripe/admin)
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY`, `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`

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

## Stripe

1. Crie os preços do plano Pro (mensal/anual) no Stripe.
2. Coloque os Price IDs em `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` e `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY`.
3. Configure o webhook apontando para:
   - `/api/billing/webhook`
4. Use o segredo do webhook em `STRIPE_WEBHOOK_SECRET`.

