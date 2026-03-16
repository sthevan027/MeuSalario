# Relatório de Status do Projeto — MeuSalario

Data: 2026-03-15

## 1) Resumo executivo

O projeto está em **estágio funcional de MVP avançado**, com os principais fluxos de simulação, autenticação, área logada, dashboard, histórico e cobrança já implementados. A base técnica está organizada, com **testes unitários de cálculos ativos e passando**, além de lint sem erros.

Ao mesmo tempo, existem pendências importantes de maturidade, principalmente em **segurança operacional** (rate limiting, trilha de auditoria, hardening de webhooks), **qualidade de engenharia** (testes de integração/E2E) e **coerência de roadmap** (itens do TODO já implementados mas ainda marcados como pendentes).

## 2) O que está pronto (evidências no código)

### Produto e funcionalidades
- Simulações de salário mensal CLT/PJ.
- Comparador CLT x PJ.
- Simulação de rescisão.
- Simulação de 13º.
- Simulação de férias.
- Dashboard e histórico.
- Exportação CSV/PDF disponível na UI.
- Integração de planos e cobrança com Asaas.

### Base técnica
- App em Next.js 14 + TypeScript.
- Cálculos em camada dedicada (`src/lib/calculators/*`) com testes unitários.
- Integração Supabase com schema e políticas RLS.
- Middleware com proteção de rotas administrativas.
- Estrutura modular de componentes e libs.

### Qualidade atual validada
- Lint (ESLint via `next lint`) sem erros.
- Testes unitários (`vitest`) passando (52 testes).

## 3) O que **não** está pronto / lacunas relevantes

### Segurança e compliance
1. **Sem rate limiting nas APIs** (inclusive webhook e billing): risco de abuso/flood.
2. **Sem trilha de auditoria** de ações críticas (mudança de plano/role, cancelamento, etc.).
3. **Sem fluxo completo de exclusão/exportação de dados LGPD** implementado.
4. **Sem proteção adicional antifraude/antireplay de webhook além de token** (há validação por token, mas sem janela temporal/replay cache).
5. **Webhook aceita erro como recebido** para evitar retries: bom para disponibilidade, porém pode mascarar falhas de processamento sem fila de compensação.

### Qualidade de testes
1. Existem testes unitários de cálculo, porém **não há suíte de integração** para fluxos server actions + Supabase.
2. **Sem E2E** para jornadas críticas (login, checkout, gestão de assinatura, admin).

### Consistência de roadmap/documentação
- O `TODO.md` ainda marca itens como pendentes que aparentemente já existem no código (ex.: exportação CSV/PDF), indicando desatualização parcial do plano.

## 4) Plano atual existente (roadmap)

Existe plano formal em `TODO.md`, com prioridades e grande backlog (produto, UX, segurança, monetização, testes, integrações). O arquivo também contém seção de “recém implementado”, mas há sinais de divergência entre checklist e estado real.

**Leitura prática:** há plano, mas precisa de uma **higienização de governança** (revisar status item a item e transformar em backlog executável com responsáveis e prazos).

## 5) Avaliação de segurança (andamento)

## Pontos positivos
- RLS habilitado em tabelas principais (`profiles`, `simulations`, `plans`).
- Policies para isolamento por usuário em `profiles` e `simulations`.
- Trigger para bloquear escalonamento de privilégio no próprio perfil (não permite trocar `role`, `plan`, etc. pelo usuário comum).
- Middleware exige autenticação em rotas privadas e valida papel admin para `/admin`.
- Rotas de billing exigem usuário autenticado.
- Validação de webhook com token (`asaas-access-token`) quando configurado.

## Pontos de atenção
- Falta rate limiting nas rotas públicas/sensíveis.
- Falta trilha de auditoria para ações administrativas e de billing.
- `handleWebhook` depende de consultas adicionais no provedor e não implementa mecanismo explícito de idempotência/replay-safe local.
- Em caso de erro no webhook, resposta pode retornar “received” para evitar retry; é necessário ter monitoramento/compensação robusta.
- Tipagem permissiva (`any`) em pontos sensíveis reduz segurança de tipo e pode esconder falhas de validação.

## Nível de maturidade de segurança (estimativa)
- **Aplicação:** intermediária.
- **Dados/RLS:** boa base.
- **Operação e hardening:** intermediária para inicial, com itens críticos pendentes.

## 6) Riscos principais hoje

1. **Risco operacional em cobrança** por ausência de estratégia completa de idempotência + auditoria no webhook.
2. **Risco de abuso de API** por falta de rate limiting.
3. **Risco de regressão funcional** em fluxos sem testes de integração/E2E.
4. **Risco de priorização ruim** por backlog desatualizado.

## 7) Recomendações objetivas para próxima linha de melhoria

### Sprint 1 (alta prioridade)
1. Implementar rate limiting em `/api/billing/*` e `/api/billing/webhook`.
2. Criar tabela de auditoria (ações admin + billing) com quem/quando/o quê.
3. Adicionar idempotência de webhook (ex.: registrar `event_id`/`payment_id` processado).
4. Criar testes de integração mínimos para checkout/cancel/manage/webhook.

### Sprint 2
1. E2E dos fluxos críticos (auth, simulação, checkout, admin).
2. Fluxos LGPD: exportação total de dados e exclusão de conta.
3. Revisar TODO.md com status real, prioridade e critérios de aceite.

### Sprint 3
1. Hardening de validação server-side com schemas Zod nas entradas de rotas/actions.
2. Padronizar logs estruturados e alertas de erro para incidentes de pagamento.
3. Melhorar cobertura de testes de componentes críticos.

## 8) Conclusão

O projeto está **bom para continuidade de evolução**, com núcleo funcional e base técnica sólida para MVP. O próximo salto de qualidade deve focar em **segurança operacional + confiabilidade de fluxos de cobrança + testes de integração/E2E + limpeza de roadmap**.

Se seguirmos essa ordem, dá para reduzir risco de produção sem travar entrega de funcionalidades novas.
