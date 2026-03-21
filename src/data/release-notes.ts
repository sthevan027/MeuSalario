/**
 * Release notes - fonte centralizada para facilitar manutenção.
 * Atualize aqui ao publicar novas versões.
 */
export type ReleaseNoteKind = 'Feature' | 'Melhoria' | 'Correção'

export type ReleaseNote = {
  version: string
  date: string
  title: string
  items: readonly string[]
  kind: ReleaseNoteKind
}

export const releaseNotes: readonly ReleaseNote[] = [
  {
    version: 'v1.4.0',
    date: '2026-03-21',
    title: 'Compatibilidade salarial com custo de vida',
    items: [
      'Nova funcionalidade: descubra se a proposta sustenta sua rotina.',
      'Simule salário, benefícios (VR/VA, VT, plano de saúde) e custos mensais.',
      'Classificação objetiva: Confortável, Viável, Apertado ou Inviável.',
      'Diagnóstico com insights práticos para decisão da oferta.',
    ],
    kind: 'Feature',
  },
  {
    version: 'v1.3.0',
    date: '2026-03-21',
    title: 'PWA e expansão mobile',
    items: [
      'App instalável como PWA no celular (Android e iOS).',
      'Menu inferior com navegação por ícones e painel expansível de simulações.',
      'Indicador de status offline e aviso quando nova versão está disponível.',
    ],
    kind: 'Feature',
  },
  {
    version: 'v1.2.1',
    date: '2026-03-16',
    title: 'Sessão e experiência de login na home',
    items: [
      'Melhoria no fluxo de sessão na raiz (/): usuários autenticados são redirecionados para /app/dashboard.',
      'Ajustes de propagação de cookies no redirecionamento para reduzir percepção de perda de login.',
    ],
    kind: 'Correção',
  },
  {
    version: 'v1.2.0',
    date: '2026-03-15',
    title: 'Preços dinâmicos no Billing',
    items: [
      'Nova API /api/billing/prices para retornar preço mensal/anual real do plano Pro.',
      'Tela de assinatura atualizada para exibir desconto e valores vindos do backend.',
      'Remoção de valores fixos de preço/desconto na interface de upgrade.',
    ],
    kind: 'Melhoria',
  },
  {
    version: 'v1.1.0',
    date: '2026-01-21',
    title: 'Dashboard e simuladores expandidos',
    items: [
      'Inclusão de simulador de 13º salário e simulador de férias.',
      'Melhorias no dashboard com métricas, previsão anual e gráficos de evolução.',
      'Filtros e estatísticas resumidas no histórico de simulações.',
    ],
    kind: 'Feature',
  },
] as const

export const latestVersion = releaseNotes[0]?.version ?? 'v1.0.0'
