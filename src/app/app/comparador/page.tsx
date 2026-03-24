import { CompareForm } from '@/components/simulations/CompareForm'
import { requireUser } from '@/lib/auth/profile'

export default async function ComparadorPage() {
  await requireUser()

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Comparador CLT x PJ</h1>
        <p className="text-sm text-slate-300">Compare lado a lado com percentuais configuráveis.</p>
      </div>

      <CompareForm />
    </div>
  )
}

