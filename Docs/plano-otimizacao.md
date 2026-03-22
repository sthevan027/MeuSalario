# Plano de Otimização - MeuSalario

## Melhorias de carregamento (implementadas)

1. **loading.tsx** — Skeletons exibidos imediatamente ao trocar de tela (Dashboard, Simulação, Conta, Histórico, Atualizações), reduzindo a sensação de lentidão.
2. **React cache()** — `getProfileOrNull` usa `cache()` para evitar chamadas duplicadas de auth + profile na mesma requisição (layout + página).
3. **Prefetch** — Links do Next.js continuam com prefetch ativo por padrão para pré-carregar rotas ao passar o mouse/ficar visíveis.

### Sobre o delay de 3–4 segundos

Mesmo em desenvolvimento local, a lentidão pode vir de:
- **Modo dev** — `next dev` é mais lento (recompilação, checagens extras). Testar com `pnpm build && pnpm start`.
- **Supabase** — latência de rede se o projeto estiver em região distante.
- **Waterfall de requests** — layout (auth + profile) + página (dados) em sequência. O `cache()` reduz duplicação do profile.

## Capacidade atual (estimada)

O sistema está hospedado em:


| Serviço             | Plano típico | Capacidade estimada                                                                       |
| ------------------- | ------------ | ----------------------------------------------------------------------------------------- |
| **Vercel**          | Hobby ou Pro | **~1.000 execuções simultâneas** por 10s por região (burst). Pro: até 30.000 concorrentes |
| **Supabase**        | Free ou Pro  | **~60–500 conexões** simultâneas (Free: ~60; Pro: ~500+). Auth e DB compartilham pool     |
| **Resend** (e-mail) | Free         | ~100 e-mails/dia                                                                          |


Em prática, o gargalo costuma ser o **Supabase** (DB + Auth). Para apps com muitas leituras e poucas escritas, o Next.js na Vercel escala bem com cache e ISR.

**Estimativa conservadora atual:**  

- **50–200 usuários simultâneos** sem degradação relevante (dependendo do plano Supabase e uso médio).

---

## Previsão / meta


| Cenário         | Usuários simultâneos | Ações necessárias                                                    |
| --------------- | -------------------- | -------------------------------------------------------------------- |
| **Curto prazo** | 500                  | Supabase Pro, monitorar métricas                                     |
| **Médio prazo** | 2.000                | Supabase Pro + Redis (Upstash) para cache, otimização de queries     |
| **Longo prazo** | 10.000+              | Supabase Enterprise ou migração parcial, CDN agressivo, edge caching |


---

## Checklist de otimização

- **Supabase:** Conferir plano e métricas (connections, CPU) no dashboard
- **Vercel:** Verificar consumo de Functions e Edge no dashboard
- **Queries:** Revisar queries lentas (ex.: histórico, dashboard) e índices
- **Cache:** Usar `revalidate` / ISR em páginas pouco dinâmicas
- **Bundle:** Manter bundle JS enxuto (code splitting, tree-shaking)
- **Imagens:** Usar `next/image` com otimização automática

---

## Notas

- As melhorias de UX (menu inferior, shimmer, etc.) **não impactam** diretamente a capacidade de usuários simultâneos.
- Para números exatos, usar: [Vercel Analytics](https://vercel.com/analytics) e [Supabase Dashboard](https://supabase.com/dashboard) → Settings → Usage.

