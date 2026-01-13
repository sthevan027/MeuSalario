import { redirect } from 'next/navigation'

export default function AppAdminRedirectPage({ params }: { params: { path?: string[] } }) {
  const rest = (params?.path ?? []).filter(Boolean)
  const target = rest.length ? `/admin/${rest.join('/')}` : '/admin'
  redirect(target)
}

