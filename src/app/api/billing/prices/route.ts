import { NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET - Retorna preços atuais do plano Pro (fonte única: tabela plans)
 */
export async function GET() {
  try {
    const supabase = await createSupabaseActionClient()

    const { data: plan, error } = await supabase
      .from('plans')
      .select('price_monthly, price_yearly')
      .eq('id', 'pro')
      .single()

    if (error || !plan) {
      return NextResponse.json({ error: 'Plano Pro não encontrado.' }, { status: 404 })
    }

    const monthly = Number(plan.price_monthly)
    const yearly = Number(plan.price_yearly)

    return NextResponse.json({
      monthly,
      yearly,
      savingsPercent: monthly > 0 ? Math.round((1 - yearly / (monthly * 12)) * 100) : 0,
      savingsReais: monthly > 0 ? Number((monthly * 12 - yearly).toFixed(2)) : 0,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar preços.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
