# Plano de Lançamento PWA + Redesign Mobile (alinhado à main atual)

> Atualizado para refletir o estado atual da branch principal do projeto (stack Next.js 14 + React 18 + Vitest).

## Objetivo
Entregar o **MeuSalário** como um app com experiência de instalação (PWA), redesign visual mobile e trilha segura de publicação, com foco em:
- instalação no celular;
- navegação por menu inferior com ícones;
- evolução do design visual sem quebrar fluxos já validados;
- área dedicada para notas de atualização (release notes);
- versões de teste para coletar feedback antes do rollout total.

## Princípios de execução
1. Implementar em etapas pequenas e reversíveis.
2. Priorizar compatibilidade com o que já está validado.
3. Garantir cobertura de testes unitários e de integração em cada etapa.
4. Validar UX mobile em breakpoints reais antes de promover para produção.

## Snapshot técnico da versão atual (main)
- Framework: **Next.js 14.2.35**.
- UI: **React 18.3.1**.
- Testes: **Vitest** (`test:run`).
- Qualidade: **ESLint via next lint**.
- Gráficos e UI utilitária: `recharts` e `lucide-react`.

> Decisão: aplicar PWA e melhorias mobile sem ruptura da estrutura existente (App Router atual), evoluindo por camadas.

## Escopo funcional

### 1) PWA
- Manifesto web (`manifest.webmanifest`) com nome, ícones, tema e modo standalone.
- Service Worker para cache básico de shell e ativos estáticos.
- Estratégias de cache:
  - estáticos: cache-first;
  - dados críticos: network-first com fallback.
- Indicador de status offline e tela de fallback mínima.
- Prompt de instalação (Android/desktop) quando suportado.

### 2) Mobile UI
- Menu inferior fixo com ícones e rótulo curto.
- Hierarquia visual simplificada para telas pequenas.
- Ajustes de espaçamento, tipografia e áreas de toque (min. 44px).
- Estados de foco/ativo claros para acessibilidade.
- Revisão de contraste e legibilidade.

### 2.1) Redesign visual (camada incremental)
- Atualização de tokens visuais (cores, elevação, bordas e densidade).
- Revisão de componentes mais usados no mobile (cards, formulários, botões e tabelas responsivas).
- Padronização de feedback visual para erro, sucesso, loading e bloqueio.
- Preservar regras de negócio e comportamento funcional já homologado.

### 3) Notas de atualização
- Página/área “Novidades” no app.
- Estrutura por versão (data, melhorias, correções, impacto para usuário).
- Fonte de dados simples (JSON/MD) para facilitar manutenção.
- Link no menu inferior (ou em perfil/configurações, conforme priorização).

## Plano por fases

### Fase 0 — Descoberta e baseline
**Entregas**
- Levantamento de telas e fluxos mais usados no mobile.
- Baseline de performance (Lighthouse mobile) e UX atual.
- Matriz de risco por módulo.

**Critérios de saída**
- Lista de gargalos mobile priorizada.
- Meta de performance e estabilidade definidas.

### Fase 1 — Fundação PWA
**Entregas**
- Manifesto + ícones + metadata.
- Registro de Service Worker.
- Fallback offline inicial.

**Critérios de saída**
- App instalável em Android/Chrome.
- Funcionamento mínimo offline para shell.

### Fase 2 — Estrutura mobile e menu inferior
**Entregas**
- Componente de Bottom Navigation reutilizável.
- Mapeamento de rotas principais com ícones.
- Ajustes de layout para evitar sobreposição com conteúdo.

**Critérios de saída**
- Navegação de 1 toque entre áreas principais.
- Sem quebra visual em breakpoints mobile prioritários.

### Fase 3 — Notas de atualização
**Entregas**
- Estrutura de dados de release notes.
- Tela/lista de atualizações com destaque da versão atual.
- Fluxo de descoberta (badge “novo” opcional).

**Critérios de saída**
- Time consegue publicar notas sem mexer na lógica principal.
- Usuário encontra facilmente o que mudou.

### Fase 4 — Hardening, QA e lançamento
**Entregas**
- Testes de regressão e smoke por dispositivo.
- Revisão de acessibilidade e desempenho.
- Checklist de rollout com plano de rollback.
- Pacote de validação para versão de testes (QA interno + beta).

**Critérios de saída**
- Métricas mínimas atingidas (Lighthouse e erros runtime).
- Aprovação final para produção.

### Fase 4.1 — Versão para testes e melhorias (beta)
**Entregas**
- Canal de release de testes com changelog dedicado.
- Instrumentação para coletar feedback (formulário in-app e eventos de uso).
- Lista priorizada de ajustes rápidos pós-feedback.

**Critérios de saída**
- Feedback consolidado em até 1 ciclo curto.
- Correções críticas aplicadas e validadas por testes automatizados.

### Fase 5 — Go-live controlado na main
**Entregas**
- Publicação gradual (ex.: 10% -> 50% -> 100%).
- Monitoramento de erros client-side e métricas de navegação mobile.
- Janela de observação pós-release com checklist de rollback.

**Critérios de saída**
- Sem crescimento relevante de erro em produção.
- Instalação PWA e fluxo principal mobile estáveis em produção.

## Backlog técnico sugerido

### PWA
- [ ] Criar `manifest.webmanifest` com ícones 192/512.
- [ ] Definir tema e splash coerentes com identidade visual.
- [ ] Implementar Service Worker com versionamento de cache.
- [ ] Tratar atualização de SW (novo conteúdo disponível).
- [ ] Exibir status offline em pontos críticos.

### Mobile UI
- [ ] Criar `BottomNav` com ícones consistentes.
- [ ] Definir 4–5 destinos primários.
- [ ] Ajustar safe-area (`env(safe-area-inset-bottom)`).
- [ ] Revisar componentes para toque e legibilidade.
- [ ] Testar em 360x800, 390x844, 412x915.
- [ ] Atualizar tokens de design mobile (cores, raio, sombra, espaçamentos).
- [ ] Homologar contraste e estados de interação por componente.

### Notas de atualização
- [ ] Definir schema (`version`, `date`, `items`, `type`).
- [ ] Criar parser/render (JSON/MD).
- [ ] Adicionar filtro “mais recentes”.
- [ ] Preparar template de publicação por release.

### Versão de testes e melhorias contínuas
- [ ] Criar trilha de release `beta` com critérios de entrada/saída.
- [ ] Habilitar coleta de feedback in-app para usuários convidados.
- [ ] Definir SLA para correções críticas (24h/48h).
- [ ] Publicar resumo semanal de melhorias aplicadas.

## Testes e qualidade (obrigatório por etapa)
- Unitários: componentes de navegação, parser de notas, utilitários de PWA.
- Integração: fluxo de navegação mobile + abertura da tela de novidades.
- Lint e estilo: execução completa antes de merge.
- Regressão manual: instalação, offline e navegação base.

## Definição de pronto (DoD)
- Funcionalidade entregue com testes unitários e integração passando.
- Lint sem erros.
- Sem regressão nos fluxos existentes.
- Documentação de release notes atualizada.

## Etapas práticas de execução (ordem sugerida)
1. **Preparar base PWA**
   - Criar manifesto e ícones.
   - Validar metadata e tema.
2. **Adicionar Service Worker com escopo mínimo**
   - Cache shell + estáticos.
   - Testar atualização de cache por versão.
3. **Implementar menu inferior mobile**
   - Componente único (`BottomNav`).
   - Inserção apenas em telas mobile.
4. **Criar área de notas de atualização**
   - Fonte simples (`JSON` ou `MD`).
   - Tela “Novidades” acessível pelo menu.
5. **Rodar versão beta de testes**
   - Liberar para grupo controlado.
   - Coletar feedback e corrigir pontos críticos.
6. **QA final e lançamento progressivo**
   - Rodar lint + testes automatizados.
   - Verificar instalação e modo offline em dispositivos alvo.

## Sequência sugerida (sprints curtas)
1. **Sprint 1:** Fundação PWA (manifest + SW + offline básico).
2. **Sprint 2:** Menu inferior + redesign visual mobile crítico.
3. **Sprint 3:** Área de notas de atualização + preparo de beta.
4. **Sprint 4:** Beta, melhorias guiadas por feedback e hardening.
5. **Sprint 5:** Rollout gradual na main + monitoramento pós-release.

## Riscos e mitigação
- **Cache desatualizado no PWA:** usar versionamento e estratégia de invalidação.
- **Regressão visual mobile:** testar com snapshots e checklist de breakpoints.
- **Complexidade de navegação:** limitar destinos do menu inferior ao essencial.
- **Baixa adoção de release notes:** destaque contextual com “novidades da versão”.
