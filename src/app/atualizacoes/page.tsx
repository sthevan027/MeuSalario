import Link from 'next/link'
import { FeedbackForm } from '@/components/FeedbackForm'
import { Header } from '@/components/layout/Header'

const releaseNotes = [
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


export default function AtualizacoesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-6 pb-20 lg:px-8">
        <section className="space-y-10 py-12 sm:py-16">
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300">
              📝 Release Notes
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl">Notas de atualização</h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-300 sm:text-base">
              Acompanhe as principais melhorias, correções e evoluções do MeuSalário.
            </p>
          </div>

          <div className="relative space-y-5 before:absolute before:bottom-4 before:left-2.5 before:top-4 before:w-px before:bg-white/10 sm:before:left-3">
            {releaseNotes.map((note) => (
              <article
                key={note.version}
                className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/50 p-5 backdrop-blur-sm sm:p-6"
              >
                <div className="absolute -left-0.5 top-6 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] sm:-left-1" />

                <div className="mb-3 flex flex-wrap items-center gap-2 pl-4 sm:pl-5">
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-300">
                    {note.version}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                    {note.kind}
                  </span>
                  <span className="text-xs text-slate-400">{note.date}</span>
                </div>

                <h2 className="mb-3 pl-4 text-xl font-semibold text-white sm:pl-5">{note.title}</h2>

                <ul className="space-y-2 pl-4 text-sm text-slate-300 sm:pl-5">
                  {note.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 text-emerald-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 p-6">
            <div className="text-center">
              <p className="text-sm text-slate-200 sm:text-base">
                Quer sugerir a próxima melhoria? Envie seu feedback pelo formulário e priorizaremos nas próximas versões.
              </p>
            </div>
            <div className="mt-6">
              <FeedbackForm initialPage="/atualizacoes" submitLabel="Enviar feedback para a equipe" />
            </div>
            <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link
                href="/faq"
                className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Ver FAQ
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
