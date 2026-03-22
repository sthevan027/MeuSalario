export default function SimulacaoLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 pt-6 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-8 w-56 rounded-lg bg-white/10" />
        <div className="h-4 w-96 rounded bg-white/5" />
      </div>
      <div className="space-y-4 rounded-xl border border-white/10 bg-slate-800/40 p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-white/5" />
        ))}
      </div>
    </div>
  )
}
