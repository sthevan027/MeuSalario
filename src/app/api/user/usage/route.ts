import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'
import { buildUsageResponse } from '@/lib/simulation-quota'

export async function GET() {
  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('plan, simulations_remaining, comparisons_remaining, compatibility_checks_remaining')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  const plan = data.plan === 'pro' ? 'pro' : 'free'
  const simulations_remaining =
    typeof data.simulations_remaining === 'number' ? data.simulations_remaining : 3
  const comparisons_remaining =
    typeof data.comparisons_remaining === 'number' ? data.comparisons_remaining : 2
  const compatibility_checks_remaining =
    typeof data.compatibility_checks_remaining === 'number'
      ? data.compatibility_checks_remaining
      : 2

  const payload = buildUsageResponse({
    plan,
    simulations_remaining,
    comparisons_remaining,
    compatibility_checks_remaining,
  })

  return NextResponse.json({
    simulations_remaining: payload.simulations_remaining,
    comparisons_remaining: payload.comparisons_remaining,
    compatibility_checks_remaining: payload.compatibility_checks_remaining,
    plan_type: payload.plan_type,
    unlimited: payload.unlimited,
  })
}
