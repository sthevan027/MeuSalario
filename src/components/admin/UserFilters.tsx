'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { useState, useTransition } from 'react'

export function UserFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const currentPlan = searchParams.get('plan') || 'all'
  const currentStatus = searchParams.get('status') || 'all'

  const updateParams = (key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === 'all' || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
      router.push(`?${params.toString()}`)
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams('search', search)
  }

  const clearSearch = () => {
    setSearch('')
    updateParams('search', '')
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Busca */}
      <form onSubmit={handleSearch} className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-900/50 py-2 pl-10 pr-10 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-violet-500/50 focus:bg-slate-800/50"
        />
        {search && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Filtro de plano */}
      <select
        value={currentPlan}
        onChange={(e) => updateParams('plan', e.target.value)}
        className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-violet-500/50"
      >
        <option value="all">Todos os planos</option>
        <option value="free">Free</option>
        <option value="pro">Pro</option>
      </select>

      {/* Filtro de status */}
      <select
        value={currentStatus}
        onChange={(e) => updateParams('status', e.target.value)}
        className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-violet-500/50"
      >
        <option value="all">Todos os status</option>
        <option value="active">Ativo</option>
        <option value="trialing">Trial</option>
        <option value="past_due">Inadimplente</option>
        <option value="canceled">Cancelado</option>
        <option value="none">Sem assinatura</option>
      </select>

      {isPending && (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      )}
    </div>
  )
}
