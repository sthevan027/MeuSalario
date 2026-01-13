import Link from 'next/link'

export function PaywallCard({
  title = 'Recurso Pro',
  description = 'Assine o Pro para liberar este recurso.',
}: {
  title?: string
  description?: string
}) {
  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4">
      <h2 className="text-base font-semibold text-sky-50">{title}</h2>
      <p className="mt-1 text-sm text-sky-100/80">{description}</p>
      <div className="mt-4">
        <Link
          href="/app/conta"
          className="inline-flex items-center justify-center rounded-lg border border-sky-400/30 bg-sky-500/20 px-3 py-2 text-sm font-medium text-sky-50 hover:bg-sky-500/30"
        >
          Ver planos
        </Link>
      </div>
    </div>
  )
}

