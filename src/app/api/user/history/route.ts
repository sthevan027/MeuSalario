import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseActionClient } from '@/lib/supabase/server'

/**
 * GET /api/user/history
 *
 * Retorna o histórico de simulações do usuário autenticado.
 *
 * Query params opcionais:
 *   ?type=monthly|comparison|compatibility|termination|thirteenth|vacation
 *   ?start=YYYY-MM-DD
 *   ?end=YYYY-MM-DD
 *   ?limit=50 (máx 100)
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const type = searchParams.get('type') // kind do input_json
  const start = searchParams.get('start') // YYYY-MM-DD
  const end = searchParams.get('end') // YYYY-MM-DD
  const rawLimit = parseInt(searchParams.get('limit') ?? '50', 10)
  const limit = Math.min(Math.max(rawLimit, 1), 100)

  let query = supabase
    .from('simulations')
    .select('id, contract_type, input_json, result_json, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Filtro de data
  if (start) {
    query = query.gte('created_at', `${start}T00:00:00.000Z`)
  }
  if (end) {
    query = query.lte('created_at', `${end}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Filtro por kind no lado Node.js (input_json->>'kind' não tem índice conveniente via PostgREST)
  const rows = (data ?? []).filter((r) => {
    if (!type) return true
    const kind = String(r.input_json?.kind ?? 'monthly')
    return kind === type
  })

  return NextResponse.json({
    data: rows.map((r) => ({
      id: r.id,
      type: String(r.input_json?.kind ?? 'monthly'),
      contract_type: r.contract_type,
      input_data: r.input_json,
      result_data: r.result_json,
      created_at: r.created_at,
    })),
    total: rows.length,
  })
}
