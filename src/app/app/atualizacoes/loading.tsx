export default function AtualizacoesLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 pt-6 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-9 w-56 rounded-lg bg-white/10" />
        <div className="h-4 w-80 rounded bg-white/5" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-2xl border border-white/10 bg-slate-800/40" />
      ))}
    </div>
  )
}
