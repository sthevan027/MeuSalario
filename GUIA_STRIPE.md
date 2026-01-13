# 🔑 Guia Completo: Configurar Stripe no MeuSalario

## 📋 Passo 1: Criar conta no Stripe

1. Acesse: https://stripe.com
2. Clique em **"Sign up"** (ou **"Entrar"** se já tiver conta)
3. Complete o cadastro (pode usar modo **Test Mode** para testar)

---

## 🔑 Passo 2: Obter as Chaves da API

### 2.1. Acessar o Dashboard
1. Faça login no Stripe
2. Vá em **Developers** → **API keys** (ou https://dashboard.stripe.com/test/apikeys)

### 2.2. Copiar a Secret Key
Você verá a **Secret key** (começa com `sk_test_...` ou `sk_live_...`):
- Esta é a **STRIPE_SECRET_KEY**
- ⚠️ **NUNCA** compartilhe ou exponha no frontend!
- Clique em **Reveal** para ver a chave completa e copie

---

## 💰 Passo 3: Criar Produtos e Preços

### 3.1. Criar Produto "Pro"
1. Vá em **Products** → **Add product** (ou https://dashboard.stripe.com/test/products)
2. Preencha:
   - **Name**: `Plano Pro`
   - **Description**: `Plano Pro do MeuSalario`
   - Clique em **Save product**

### 3.2. Criar Preço Mensal
1. No produto criado, clique em **Add price**
2. Configure:
   - **Pricing model**: `Standard pricing`
   - **Price**: `R$ 7,90` (ou `7.90` em BRL)
   - **Billing period**: `Monthly`
   - Clique em **Add price**
3. **Copie o Price ID** (começa com `price_...`) → Esta é a **NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY**

### 3.3. Criar Preço Anual
1. No mesmo produto, clique em **Add price** novamente
2. Configure:
   - **Price**: `R$ 79,00` (ou `79.00` em BRL)
   - **Billing period**: `Yearly`
   - Clique em **Add price**
3. **Copie o Price ID** → Esta é a **NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY**

---

## 🔔 Passo 4: Configurar Webhook

### 4.1. Criar Webhook Endpoint
1. Vá em **Developers** → **Webhooks** → **Add endpoint** (ou https://dashboard.stripe.com/test/webhooks)
2. Configure:
   - **Endpoint URL**: 
     - **Local**: `http://localhost:3000/api/billing/webhook`
     - **Produção**: `https://seudominio.com/api/billing/webhook`
   - **Description**: `MeuSalario - Webhook de assinaturas`
   - Clique em **Add endpoint**

### 4.2. Selecionar Eventos
1. Na página do webhook, clique em **Add events**
2. Selecione estes eventos:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
3. Clique em **Add events**

### 4.3. Copiar Webhook Secret
1. Na página do webhook, encontre **Signing secret**
2. Clique em **Reveal** e **copie o secret** (começa com `whsec_...`)
3. Esta é a **STRIPE_WEBHOOK_SECRET**

---

## ⚙️ Passo 5: Adicionar no .env.local

Abra o arquivo `.env.local` na raiz do projeto e adicione:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_51ABC... (sua chave secreta)
STRIPE_WEBHOOK_SECRET=whsec_ABC... (seu webhook secret)
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_ABC... (ID do preço mensal)
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_XYZ... (ID do preço anual)
```

### Exemplo completo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe
STRIPE_SECRET_KEY=sk_test_51ABC123def456ghi789jkl012mno345pqr678stu901vwx234yz
STRIPE_WEBHOOK_SECRET=whsec_ABC123def456ghi789jkl012mno345pqr678stu901vwx234yz
NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY=price_1ABC123def456ghi789jkl012
NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY=price_1XYZ789abc123def456ghi012
```

---

## ✅ Passo 6: Testar

1. Reinicie o servidor: `pnpm dev`
2. Faça login no app
3. Clique em **"Upgrade para Pro"**
4. Teste o checkout (use cartão de teste: `4242 4242 4242 4242`)

---

## 🧪 Cartões de Teste do Stripe

Para testar pagamentos, use:

- **Sucesso**: `4242 4242 4242 4242`
- **Falha**: `4000 0000 0000 0002`
- **Qualquer data futura** (ex: 12/25)
- **Qualquer CVC** (ex: 123)

---

## 📝 Resumo das Variáveis Necessárias

| Variável | Onde encontrar | Exemplo |
|----------|---------------|---------|
| `STRIPE_SECRET_KEY` | Developers → API keys → Secret key | `sk_test_51...` |
| `STRIPE_WEBHOOK_SECRET` | Developers → Webhooks → Signing secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY` | Products → Preço mensal → Price ID | `price_1...` |
| `NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY` | Products → Preço anual → Price ID | `price_1...` |

---

## ⚠️ Importante

- **Test Mode vs Live Mode**: 
  - Use **Test Mode** para desenvolvimento
  - Use **Live Mode** para produção (troque as chaves quando for publicar)

- **Segurança**:
  - ⚠️ **NUNCA** commite o `.env.local` no Git
  - ⚠️ **NUNCA** exponha `STRIPE_SECRET_KEY` no frontend
  - ✅ O arquivo `.env.local` já está no `.gitignore`

---

## 🆘 Problemas Comuns

**Erro: "Stripe não configurado"**
- Verifique se todas as variáveis estão no `.env.local`
- Reinicie o servidor após adicionar variáveis

**Webhook não funciona localmente**
- Use o Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`
- Ou use ngrok para expor localhost: `ngrok http 3000`

**Preço não encontrado**
- Verifique se os Price IDs estão corretos
- Confirme que os preços estão **ativos** no Stripe

---

Pronto! Agora você tem tudo configurado! 🎉
