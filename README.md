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
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

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

1. Crie uma conta no [Stripe](https://dashboard.stripe.com/) (use modo teste para desenvolvimento).
2. Obtenha sua `STRIPE_SECRET_KEY` no painel (Chaves de API).
3. Configure o webhook no painel do Stripe apontando para:
   - `https://seu-dominio.com/api/billing/webhook`
4. Eventos recomendados: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.
5. Defina o signing secret do webhook em `STRIPE_WEBHOOK_SECRET`.
6. Configure `NEXT_PUBLIC_APP_URL` (ex: `http://localhost:3000` ou sua URL de produção) para os redirects do Checkout.

Os preços dos planos são definidos na tabela `plans` do Supabase e usados no Checkout Stripe.
