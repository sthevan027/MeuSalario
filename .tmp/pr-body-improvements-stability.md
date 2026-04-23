## Summary
- Adiciona disclaimer de precisão (80–90%) em todos os simuladores
- Adiciona ErrorBoundary e rotas `error.tsx` para app e admin
- Melhora logging do webhook do Asaas com correlation ID + contexto no Sentry
- Completa admin com contagem de simulações e card de usuários inativos
- Move alíquotas hardcoded (INSS/IRRF/DAS) para config no Supabase com fallback
- Adiciona testes unitários para helpers do webhook e para usage/quota

## Test plan
- [ ] Abrir simuladores (mensal, 13º, férias, rescisão, comparador, compatibilidade) e confirmar disclaimer
- [ ] Forçar erro em um componente e confirmar fallback do `error.tsx`/ErrorBoundary
- [ ] Enviar evento de webhook (sandbox) e validar logs com `cid`
- [ ] Verificar admin: coluna de simulações + card de usuários inativos
- [ ] Rodar `vitest run` (quando ambiente tiver node_modules/pm instalado)

