# Plano de Lançamento PWA + Redesign Mobile

## Objetivo
Entregar o **MeuSalário** como um app com experiência de instalação (PWA) e navegação mobile otimizada, com foco em:
- instalação no celular;
- navegação por menu inferior com ícones;
- área dedicada para notas de atualização (release notes);
- estabilidade e baixo risco de regressão.

## Princípios de execução
1. Implementar em etapas pequenas e reversíveis.
2. Priorizar compatibilidade com o que já está validado.
3. Garantir cobertura de testes unitários e de integração em cada etapa.
4. Validar UX mobile em breakpoints reais antes de promover para produção.

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

**Critérios de saída**
- Métricas mínimas atingidas (Lighthouse e erros runtime).
- Aprovação final para produção.

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

### Notas de atualização
- [ ] Definir schema (`version`, `date`, `items`, `type`).
- [ ] Criar parser/render (JSON/MD).
- [ ] Adicionar filtro “mais recentes”.
- [ ] Preparar template de publicação por release.

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

## Sequência sugerida (sprints curtas)
1. **Sprint 1:** Fundação PWA (manifest + SW + offline básico).
2. **Sprint 2:** Menu inferior + ajustes visuais mobile críticos.
3. **Sprint 3:** Área de notas de atualização + refinamentos.
4. **Sprint 4:** Hardening, métricas e rollout gradual.

## Riscos e mitigação
- **Cache desatualizado no PWA:** usar versionamento e estratégia de invalidação.
- **Regressão visual mobile:** testar com snapshots e checklist de breakpoints.
- **Complexidade de navegação:** limitar destinos do menu inferior ao essencial.
- **Baixa adoção de release notes:** destaque contextual com “novidades da versão”.
