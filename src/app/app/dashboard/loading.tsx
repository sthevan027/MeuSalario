export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6 p-4 pt-6 sm:p-6 lg:p-8">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 rounded-lg bg-white/10" />
          <div className="h-4 w-80 rounded bg-white/5" />
        </div>
        <div className="h-10 w-20 rounded-lg bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
            <div className="h-3 w-16 rounded bg-white/5" />
            <div className="mt-2 h-8 w-24 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="h-20 rounded-xl border border-white/10 bg-slate-800/40" />
      <div className="h-64 rounded-xl border border-white/10 bg-slate-800/40 p-6">
        <div className="h-5 w-48 rounded bg-white/5" />
        <div className="mt-2 h-4 w-32 rounded bg-white/5" />
        <div className="mt-6 h-48 rounded-lg bg-white/5" />
      </div>
    </div>
  )
}
