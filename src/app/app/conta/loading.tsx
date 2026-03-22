export default function ContaLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 pt-6 sm:p-6 lg:p-8">
      <div className="space-y-2">
        <div className="h-9 w-48 rounded-lg bg-white/10" />
        <div className="h-4 w-72 rounded bg-white/5" />
      </div>
      <div className="h-40 rounded-2xl border border-white/10 bg-slate-800/40" />
      <div className="h-32 rounded-2xl border border-white/10 bg-slate-800/40" />
    </div>
  )
}
