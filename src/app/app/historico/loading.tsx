export default function HistoricoLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 pt-6 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-8 w-32 rounded-lg bg-white/10" />
        <div className="h-4 w-64 rounded bg-white/5" />
      </div>
      <div className="rounded-xl border border-white/10 bg-slate-800/40">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 border-b border-white/5 p-4 last:border-0">
            <div className="h-4 w-24 rounded bg-white/5" />
            <div className="h-4 flex-1 rounded bg-white/5" />
            <div className="h-4 w-20 rounded bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  )
}
