'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function FeedbackForm() {
  const [suggestion, setSuggestion] = useState('')
  const [context, setContext] = useState('')
  const [impact, setImpact] = useState('')
  const [page, setPage] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion,
          context,
          impact,
          page,
          userEmail,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao enviar feedback')
      }

      setSubmitted(true)
      setSuggestion('')
      setContext('')
      setImpact('')
      setPage('')
      setUserEmail('')
    } catch (err) {
      setError('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <p className="text-emerald-300">Feedback enviado com sucesso! Obrigado pela sugestão.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          Seu Email (opcional)
        </label>
        <Input
          id="userEmail"
          type="email"
          value={userEmail}
          onChange={(e) => setUserEmail(e.target.value)}
          placeholder="Para entrarmos em contato se necessário"
          className="mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={isSubmitting || !suggestion.trim()}
        className="w-full"
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
      </Button>
    </form>
  )
}