# TODO - MeuSalario

Lista de tarefas e melhorias para implementar no projeto.

## 📊 Resumo do Progresso


| Categoria                  | Concluído | Pendente | Total  |
| -------------------------- | --------- | -------- | ------ |
| Funcionalidades Principais | 6         | 18       | 24     |
| Experiência do Usuário     | 0         | 19       | 19     |
| Segurança e Dados          | 0         | 7        | 7      |
| Monetização                | 5         | 1        | 6      |
| Testes e Qualidade         | 0         | 7        | 7      |
| **Total**                  | **11**    | **53**   | **64** |


---

## 🎯 Funcionalidades Principais

### Simulações e Cálculos

- **Exportação PDF/CSV** - Permitir exportar simulações em PDF e CSV ⚠️ *Mencionado na landing page, implementação pendente*
- **Simulação de 13º salário** - Adicionar cálculo específico para 13º salário proporcional ✅
- **Simulação de férias** - Cálculo de férias proporcionais e vencidas ✅
- **Múltiplos contratos** - Permitir gerenciar múltiplos contratos (ex: CLT + PJ simultâneos)
- **Comparação de cenários** - Comparar múltiplos cenários lado a lado (ex: com/sem horas extras)
- **Descontos variáveis** - Permitir adicionar descontos customizados (vale transporte, plano de saúde, etc.)

### Dashboard e Análises

- **Gráficos adicionais** - Evolução de descontos, comparação CLT vs PJ ao longo do tempo ✅
- **Previsão anual** - Projeção de recebimentos ao longo do ano ✅
- **Métricas de economia** - Comparando com estimativas anteriores ✅
- **Alertas e notificações** - Alertar sobre mudanças significativas nos valores
- **Filtros no histórico** - Filtrar por tipo de contrato, período, valor mínimo/máximo ✅
- **Estatísticas resumidas** - Média, mediana, maior/menor salário líquido no período ✅

### PJ - Melhorias Específicas

- **Cálculo de faturamento anual acumulado** - Rastrear faturamento para cálculo correto do Simples Nacional
- **Suporte a outros anexos do Simples** - Adicionar Anexo I, II, IV além de III e V
- **Cálculo de MEI** - Adicionar suporte para Microempreendedor Individual
- **Despesas dedutíveis** - Considerar despesas que reduzem a base de cálculo
- **Pró-labore variável** - Permitir diferentes valores de pró-labore por mês
- **Simulação de distribuição de lucros** - Calcular impacto de distribuição de lucros vs pró-labore

### CLT - Melhorias Específicas

- **Vale transporte** - Cálculo automático de desconto de vale transporte
- **Plano de saúde** - Adicionar desconto de plano de saúde
- **Vale refeição/alimentação** - Considerar benefícios não tributáveis
- **Adiantamento quinzenal** - Melhorar cálculo de adiantamento com datas customizáveis
- **Salário família** - Calcular benefício de salário família quando aplicável
- **Auxílio creche** - Considerar auxílio creche (não tributável)
- **FGTS mensal** - Mostrar depósito mensal de FGTS (informação, não desconto)

### Rescisão - Melhorias

- **Cálculo de férias proporcionais mais preciso** - Considerar período aquisitivo completo
- **Multa do FGTS por tipo de rescisão** - Ajustar multa conforme tipo (40%, 20%, 0%)
- **Aviso prévio trabalhado** - Considerar quando aviso prévio foi cumprido
- **Desconto de adiantamento** - Descontar adiantamentos já recebidos
- **Simulação de acordo trabalhista** - Calcular valores em caso de acordo
- **Comparação de cenários de rescisão** - Comparar diferentes tipos de rescisão

---

## 🚀 Experiência do Usuário

### Interface

- **Modo escuro/claro** - Adicionar toggle de tema (atualmente só escuro)
- **Animações suaves** - Adicionar transições e animações para melhor UX
- **Loading states** - Melhorar feedback visual durante cálculos e carregamentos
- **Skeleton screens** - Adicionar placeholders durante carregamento
- **Tooltips informativos** - Explicar termos técnicos (INSS, IRRF, DAS, etc.)
- **Tutorial interativo** - Onboarding para novos usuários
- **Atalhos de teclado** - Adicionar shortcuts para ações frequentes
- **Responsividade aprimorada** - Melhorar experiência em tablets e telas pequenas

### Formulários

- **Validação em tempo real** - Feedback imediato de erros nos campos
- **Autocomplete inteligente** - Sugerir valores baseados em simulações anteriores
- **Salvar rascunho** - Salvar automaticamente progresso nos formulários
- **Campos condicionais** - Mostrar/ocultar campos baseado em seleções
- **Máscaras de input** - Melhorar formatação de valores monetários
- **Histórico de valores** - Mostrar últimos valores inseridos em cada campo

### Acessibilidade

- **ARIA labels** - Adicionar labels adequados para screen readers
- **Navegação por teclado** - Garantir navegação completa via teclado
- **Contraste de cores** - Verificar e ajustar contraste para WCAG AA
- **Foco visível** - Melhorar indicadores de foco em elementos interativos

### Performance

- **Debounce nos inputs** - Reduzir cálculos durante digitação
- **Service Worker (PWA)** - Transformar em Progressive Web App
- **Bundle analysis** - Analisar e otimizar tamanho do bundle
- **Image optimization** - Otimizar imagens estáticas (se houver)
- **Database indexes** - Adicionar índices para queries frequentes
- **Query optimization** - Otimizar queries complexas do dashboard
- **Infinite scroll** - Implementar scroll infinito no histórico (se necessário)

---

## 🔐 Segurança e Dados

- **Backup automático** - Sistema de backup das simulações do usuário
- **Exportação de dados** - Permitir exportar todos os dados do usuário (LGPD)
- **Exclusão de conta** - Implementar exclusão completa de dados
- **Auditoria de ações** - Log de ações importantes (salvar, deletar simulações)
- **Rate limiting** - Proteger APIs contra abuso
- **Validação de inputs** - Validação mais rigorosa no servidor
- **Sanitização de dados** - Garantir que dados não sejam maliciosos

---

## 💰 Monetização e Planos

- **Plano anual com desconto** - 17% de economia ✅
- **Trial estendido** - Trial de 14 dias para plano Pro ✅
- **Upgrade/downgrade** - Mudança de plano a qualquer momento ✅
- **Cancelamento com retenção** - Fluxo com ofertas de retenção (20% ou 30%) ✅
- **Cupons de desconto** - Sistema de códigos promocionais ✅
- **Limites do plano Free** - Definir limites claros (ex: 5 simulações/mês)

---

## 📱 Mobile e Apps

- **App mobile nativo** - Considerar React Native ou Flutter
- **PWA completo** - Transformar em PWA instalável
- **Notificações push** - Notificar sobre novas funcionalidades ou lembretes
- **Widgets** - Widgets para home screen (iOS/Android)
- **Deep linking** - Links diretos para simulações específicas

---

## 🧪 Testes e Qualidade

- **Testes unitários** - Testes para funções de cálculo (tax.ts, monthly.ts, etc.)
- **Testes de integração** - Testes de fluxos completos (criar simulação, salvar, etc.)
- **Testes E2E** - Testes end-to-end com Playwright ou Cypress
- **Testes de acessibilidade** - Testes automatizados de acessibilidade
- **CI/CD** - Pipeline de deploy automático
- **Monitoramento de erros** - Integrar Sentry ou similar
- **Analytics** - Adicionar analytics (Google Analytics, Plausible, etc.)

---

## 🌐 Internacionalização

- **Suporte a múltiplos idiomas** - i18n para inglês, espanhol
- **Suporte a outras moedas** - Permitir visualização em outras moedas
- **Regiões diferentes** - Adaptar cálculos para outros países (futuro)

---

## 🔗 Integrações

- **Integração com contadores** - Permitir exportar dados para contadores
- **API pública** - API para desenvolvedores integrarem
- **Webhooks** - Webhooks para eventos (nova simulação, etc.)
- **Integração com calendário** - Lembretes de datas importantes (vencimento de férias, etc.)

---

## 🎨 Marketing e Growth

- **Landing page otimizada** - A/B testing de elementos da landing
- **Blog/Conteúdo** - Blog com dicas sobre finanças e impostos
- **Programa de afiliados** - Sistema de indicação com recompensas
- **Email marketing** - Campanhas de email para reativação
- **Social proof** - Depoimentos e avaliações de usuários
- **Calculadora pública** - Versão simplificada para compartilhamento

---

## 🐛 Bugs e Melhorias Técnicas

- **Tratamento de erros** - Melhorar mensagens de erro para usuário
- **Logging** - Sistema de logs estruturado
- **Health checks** - Endpoints de health check para monitoramento
- **Migração de dados** - Ferramentas para migração de dados entre versões
- **Refatoração de código** - Revisar e refatorar código legado
- **Type safety** - Melhorar tipagem TypeScript em áreas críticas

---

## 🚨 Priorização Sugerida

### Alta Prioridade (Próximas Sprints)


| Item                    | Motivo                       |
| ----------------------- | ---------------------------- |
| Exportação PDF/CSV      | Já prometido na landing page |
| Debounce nos inputs     | Performance e UX             |
| Testes unitários        | Confiabilidade dos cálculos  |
| Modo escuro/claro       | UX solicitada frequentemente |
| Validação em tempo real | UX nos formulários           |


### Média Prioridade


| Item                  | Motivo                |
| --------------------- | --------------------- |
| Cálculo de MEI        | Demanda do mercado    |
| PWA básico            | Instalação mobile     |
| Tooltips informativos | Educação do usuário   |
| Vale transporte (CLT) | Funcionalidade comum  |
| Melhorias em rescisão | Completude do produto |


### Baixa Prioridade


| Item                  | Motivo                       |
| --------------------- | ---------------------------- |
| App mobile nativo     | Custo alto, PWA é suficiente |
| Integrações externas  | Demanda baixa                |
| Internacionalização   | Foco no mercado BR           |
| Programa de afiliados | Marketing futuro             |


---

## 🛠️ Stack Técnica Atual

- **Frontend:** Next.js 14, React 18, TypeScript 5
- **Styling:** Tailwind CSS 3, @tailwindcss/forms
- **Gráficos:** Recharts 3
- **Backend:** Supabase (Auth, Database)
- **Pagamentos:** Stripe (principal), Asaas (alternativo)
- **Validação:** Zod 4
- **Ícones:** Lucide React
- **Datas:** date-fns 4

---

**Última atualização:** 2026-02-27

---

## ✅ Histórico de Implementações

### Janeiro 2026

#### Dashboard e Análises (2026-01-21)

- ✅ Gráfico de evolução de descontos (INSS, IRRF, total)
- ✅ Gráfico de comparação CLT vs PJ ao longo do tempo
- ✅ Previsão anual com projeção de recebimentos para os próximos 12 meses
- ✅ Métricas de economia comparando com primeira estimativa
- ✅ Filtros no histórico (tipo de contrato, tipo de simulação, valor, período)
- ✅ Estatísticas resumidas no dashboard (média, mediana, maior, menor)
- ✅ Componente DashboardStats com análise de tendências

#### Simulações (2026-01-21)

- ✅ Simulação de 13º salário (CLT) com cálculo de 1ª e 2ª parcela
- ✅ Simulação de férias (CLT) com férias vencidas e proporcionais + 1/3
- ✅ Páginas dedicadas para 13º salário e férias
- ✅ Integração com histórico e salvamento de simulações
- ✅ Campo "Salário base" preenchido automaticamente com último valor do histórico

#### Monetização (2026-01-20)

- ✅ Plano anual com desconto (17% de economia)
- ✅ Trial de 14 dias para novos clientes
- ✅ Sistema de upgrade/downgrade entre mensal e anual
- ✅ Cancelamento com ofertas de retenção (20% ou 30% de desconto)
- ✅ Suporte a cupons promocionais no checkout Stripe

