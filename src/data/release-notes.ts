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
    version: 'v1.5.1',
    date: '2026-04-07',
    title: 'Correções de segurança e estabilidade da cota',
    items: [
      'Correção: parâmetro next no fluxo de login sanitizado no auth/callback, evitando redirecionamentos abertos para sites externos.',
      'Correção: fim do loop de login quando ainda não existe linha correspondente em profiles.',
      'Correção: migração da view simulations_with_user no Supabase com DROP VIEW, evitando erro 42P16 ao alterar colunas.',
      'Correção: estorno de quota de simulações permitido apenas via backend confiável (service_role e usuário explícito), não pela API pública.',
      'Melhoria: ícones PWA e Apple atualizados e otimizados (incluindo 192×192 e 512×512) para instalação e atalhos no sistema.',
      'Melhoria: projeto publicado sob licença MIT (arquivo LICENSE no repositório).',
    ],
    kind: 'Correção',
  },
  {
    version: 'v1.5.0',
    date: '2026-03-24',
    title: 'Limite de simulações no plano FREE',
    items: [
      'Plano FREE: todas as telas e simuladores acessíveis; o limite aplica-se apenas a quantas simulações podem ser salvas no histórico (Pro continua ilimitado).',
      'Plano FREE passa a ter um número de simulações salvas no histórico; cada simulação consome uma unidade até o limite.',
      'Banner no topo do app com “Simulações restantes” e destaque quando o saldo está baixo.',
      'Ao entrar, modal informando quantas simulações ainda dá para usar, com atalho para conta/upgrade.',
      'Ao atingir o limite, bloqueio com orientação para upgrade Pro ou futura compra de pacotes de créditos.',
      'Feedback após salvar simulação mensal com mensagem de sucesso e saldo atualizado.',
      'APIs: GET /api/user/usage (saldo e tipo de plano) e POST /api/simulate (simulação mensal com a mesma regra de quota).',
      'Limite inicial para novos cadastros configurável no Supabase (app_config.free_simulations_limit).',
    ],
    kind: 'Feature',
  },
  {
    version: 'v1.4.1',
    date: '2026-03-22',
    title: 'Redesign do menu inferior e animações',
    items: [
      'Novo design do menu inferior com cantos arredondados e visual mais limpo.',
      'Menu lateral removido da área do app — navegação centralizada no bottom nav (mobile e desktop).',
      'Animação shimmer ao selecionar itens do menu.',
      'Modal de simulações com arrastar para baixo para fechar.',
      'Ícones e textos alinhados; círculo translúcido no item selecionado.',
    ],
    kind: 'Melhoria',
  },
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
