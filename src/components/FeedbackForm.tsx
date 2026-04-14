'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FEEDBACK_EMAIL } from '@/lib/feedback'

type FeedbackFormProps = {
  initialPage?: string
  showPageField?: boolean
  submitLabel?: string
}

function buildMailto(params: {
  suggestion: string
  context: string
  impact: string
  page: string
  userEmail: string
}): string {
  const subject = encodeURIComponent('Feedback MeuSalário')
  const body = encodeURIComponent(
    [
      'Sugestão:',
      params.suggestion,
      '',
      params.context ? `Contexto:\n${params.context}` : '',
      '',
      params.page ? `Página/fluxo:\n${params.page}` : '',
      '',
      params.impact ? `Impacto:\n${params.impact}` : '',
      '',
      params.userEmail ? `Contato:\n${params.userEmail}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  )
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
}

export function FeedbackForm({
  initialPage = '',
  showPageField = true,
  submitLabel = 'Abrir e-mail para enviar',
}: FeedbackFormProps) {
  const [suggestion, setSuggestion] = useState('')
  const [context, setContext] = useState('')
  const [impact, setImpact] = useState('')
  const [page, setPage] = useState(initialPage)
  const [userEmail, setUserEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const href = buildMailto({ suggestion, context, impact, page, userEmail })
    window.location.href = href
    setSubmitted(true)
    setSuggestion('')
    setContext('')
    setImpact('')
    setPage('')
    setUserEmail('')
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center space-y-2">
        <p className="text-emerald-300">
          Se o seu cliente de e-mail não abriu, envie manualmente para{' '}
          <a className="underline font-medium" href={`mailto:${FEEDBACK_EMAIL}`}>
            {FEEDBACK_EMAIL}
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="text-sm text-slate-400 underline hover:text-white"
        >
          Enviar outro feedback
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-slate-400">
        Ao enviar, abrimos seu e-mail com a mensagem pronta para{' '}
        <span className="text-slate-300">{FEEDBACK_EMAIL}</span>.
      </p>

      <div>
        <label htmlFor="suggestion" className="block text-sm font-medium text-slate-300">
          Sugestão *
        </label>
        <textarea
          id="suggestion"
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="Descreva sua sugestão ou melhoria..."
          required
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-slate-300">
          Contexto
        </label>
        <textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Adicione mais detalhes sobre o contexto..."
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          rows={2}
        />
      </div>

      {showPageField ? (
        <div>
          <label htmlFor="page" className="block text-sm font-medium text-slate-300">
            Página/Fluxo
          </label>
          <Input
            id="page"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="Onde isso acontece? (ex: Dashboard, Simulação)"
            className="mt-1"
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="impact" className="block text-sm font-medium text-slate-300">
          Impacto
        </label>
        <textarea
          id="impact"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          placeholder="Qual o impacto dessa melhoria?"
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="userEmail" className="block text-sm font-medium text-slate-300">
          Seu e-mail (opcional)
        </label>
        <Input
          id="userEmail"
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Para retorno, se quiser"
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={!suggestion.trim()} className="w-full">
        {submitLabel}
      </Button>
    </form>
  )
}
