import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripeProvider } from '@/lib/payments/stripe-provider'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapStripeStatus(status: string): 'active' | 'trialing' | 'past_due' | 'canceled' | 'none' {
  switch (status) {
    case 'ACTIVE':
      return 'active'
    case 'PENDING':
      return 'trialing'
    case 'OVERDUE':
      return 'past_due'
    case 'CANCELED':
      return 'canceled'
    default:
      return 'none'
  }
}

function planFromStatus(mapped: string): 'free' | 'pro' {
  return mapped === 'active' || mapped === 'trialing' ? 'pro' : 'free'
}

/**
 * POST - Processa webhooks do Stripe
 */
export async function POST(request: Request) {
  try {
    const stripe = getStripeProvider()
    const headersList = headers()
    const body = await request.text()

    const admin = createSupabaseAdminClient()

    if (!admin) {
      return NextResponse.json({ error: 'Supabase Admin não configurado.' }, { status: 500 })
    }

    const result = await stripe.handleWebhook(body, headersList)

    if (!result) {
      return NextResponse.json({ received: true, message: 'Evento não processado' })
    }

    const mappedStatus = mapStripeStatus(result.status)
    const plan = planFromStatus(mappedStatus)

    const updateData: Record<string, unknown> = {
      subscription_status: mappedStatus,
      plan,
    }

    if (result.subscriptionId) {
      updateData.stripe_subscription_id = result.subscriptionId
    }

    await admin
      .from('profiles')
      .update(updateData)
      .eq('id', result.userId)

    return NextResponse.json({ received: true, processed: true })
  } catch (error: unknown) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : ''

    if (message.includes('signature') || message.includes('Webhook')) {
      return NextResponse.json({ error: message }, { status: 401 })
    }

    return NextResponse.json({
      received: true,
      error: message,
      note: 'Erro processado, mas webhook aceito para evitar retries',
    })
  }
}
