export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-slate-100">
      <div className="max-w-md space-y-3">
        <h1 className="text-2xl font-bold">Você está offline</h1>
        <p className="text-sm text-slate-300">
          Sem conexão no momento. Algumas funcionalidades do MeuSalario seguem disponíveis com cache local.
        </p>
      </div>
    </main>
  )
}
