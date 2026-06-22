# MeuSalario

![Status](https://img.shields.io/badge/status-em%20produ%C3%A7%C3%A3o-success)

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss&logoColor=white) ![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white) ![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)

Plataforma web para **previsão salarial**, simulações e dashboards (CLT/PJ), com **Supabase** (Auth/DB) e **Asaas** (pagamentos - PIX, cartão, boleto).

## Funcionalidades

- **Simulação mensal** (CLT e PJ) com cálculo automático de INSS e IRRF
- **Comparador CLT x PJ** para ajudar na decisão de carreira
- **Simulação de rescisão** (sem justa causa, acordo, pedido de demissão)
- **Simulação de 13º salário** (1ª e 2ª parcela)
- **Simulação de férias** (vencidas e proporcionais)
- **Dashboard** com gráficos e estatísticas
- **Histórico** de simulações com filtros
- **Exportação** PDF e CSV das simulações
- **Planos** Free e Pro com pagamento via Asaas

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
  - `SUPABASE_SERVICE_ROLE_KEY` (necessária para webhook/admin)
  - Asaas: `ASAAS_API_KEY`, `ASAAS_WEBHOOK_TOKEN`, `ASAAS_SANDBOX`
  - `NEXT_PUBLIC_APP_URL`

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

## Documentação de planejamento

- `docs/planejamento-compatibilidade-salarial.md` — proposta da nova atualização de compatibilidade salarial com custo de vida, benefícios e comparação CLT/PJ.

## Testes

O projeto usa Vitest para testes unitários dos cálculos de impostos.

```bash
pnpm test
```

Os testes cobrem:
- Cálculo de INSS (tabela progressiva 2026)
- Cálculo de IRRF (com isenção até R$ 5.000)
- DAS do Simples Nacional (Anexos III e V)
- Simulação mensal CLT e PJ
- Cálculo de rescisão
- Cálculo de férias
- Cálculo de 13º salário

## Supabase (schema + RLS)

Rode o SQL do arquivo:

- `supabase/schema.sql`

Isso cria:
- `profiles` (1-para-1 com `auth.users`)
- `simulations`
- `plans`
- trigger de criação de profile
- RLS básico

## Asaas (Pagamentos)

O MeuSalario usa o [Asaas](https://www.asaas.com/) como gateway de pagamentos, que suporta:
- **Cartão de crédito** (parcelado ou à vista)
- **Boleto bancário**
- **PIX**

### Configuração

1. Crie uma conta no [Asaas](https://www.asaas.com/) (use ambiente sandbox para desenvolvimento)
2. Obtenha sua `ASAAS_API_KEY` no painel (Integrações > API)
3. Configure o webhook no painel do Asaas apontando para:
   - `https://seu-dominio.com/api/billing/webhook`
4. Eventos recomendados: `PAYMENT_RECEIVED`, `SUBSCRIPTION_CREATED`
5. Defina o token do webhook em `ASAAS_WEBHOOK_TOKEN`
6. Configure `ASAAS_SANDBOX=true` para desenvolvimento, `false` para produção

Os preços dos planos são definidos na tabela `plans` do Supabase.

## Monitoramento de Erros (Sentry)

O projeto suporta monitoramento de erros via Sentry (opcional).

1. Crie uma conta em [sentry.io](https://sentry.io/)
2. Crie um projeto Next.js
3. Copie o DSN e adicione em `NEXT_PUBLIC_SENTRY_DSN` no `.env`

Funções disponíveis:
- `captureException(error)` - Captura exceções
- `captureMessage(message, level)` - Captura mensagens
- `setUser({ id, email })` - Define usuário atual

## Estrutura do Projeto

```
src/
├── app/                    # Rotas Next.js (App Router)
│   ├── (auth)/            # Páginas de autenticação
│   ├── app/               # Área logada do usuário
│   ├── admin/             # Painel administrativo
│   └── api/               # Rotas de API
├── components/            # Componentes React
│   ├── auth/              # Formulários de auth
│   ├── billing/           # Componentes de pagamento
│   ├── charts/            # Gráficos (Recharts)
│   ├── dashboard/         # Componentes do dashboard
│   ├── historico/         # Histórico de simulações
│   ├── layout/            # Layout e navegação
│   ├── simulations/       # Formulários de simulação
│   └── ui/                # Componentes base (Button, Input, etc)
├── lib/                   # Utilitários e lógica
│   ├── calculators/       # Cálculos de impostos e simulações
│   │   └── __tests__/     # Testes unitários
│   ├── payments/          # Integração com Asaas
│   └── supabase/          # Cliente Supabase
└── types/                 # Tipos TypeScript
```

## Notas de dependências

- **ESLint 8 e subdependências deprecated:** O `pnpm install` pode mostrar avisos de que `eslint@8.57.1` e pacotes como `glob`, `inflight`, `rimraf` estão deprecated. Isso é esperado: o Next.js 14 usa `eslint-config-next`, que ainda declara suporte apenas a ESLint 7/8. Migrar para ESLint 9 exigiria atualizar o Next.js para uma versão que suporte o plugin em flat config (ex.: Next 15). Por enquanto o lint continua funcionando normalmente.

## Licença

Privado - Todos os direitos reservados.
