import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { buildUsageResponse } from '@/lib/simulation-quota'

export async function GET() {
  const supabase = createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, simulations_remaining')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  const plan = data.plan === 'pro' ? 'pro' : 'free'
  const remaining =
    typeof data.simulations_remaining === 'number' ? data.simulations_remaining : 3

  const payload = buildUsageResponse({ plan, simulations_remaining: remaining })

  return NextResponse.json({
    simulations_remaining: payload.simulations_remaining,
    plan_type: payload.plan_type,
    unlimited: payload.unlimited,
  })
}
