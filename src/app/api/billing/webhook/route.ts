import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { env } from '@/lib/env'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function mapStripeStatus(status: string | null | undefined) {
  switch (status) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
      return 'canceled'
    default:
      return 'none'
  }
}

function planFromStatus(mapped: string) {
  return mapped === 'active' || mapped === 'trialing' ? 'pro' : 'free'
}

export async function POST(request: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET não configurada.' }, { status: 500 })
  }

  const stripe = getStripe()
  const signature = headers().get('stripe-signature')
  const body = await request.text()

  if (!signature) return NextResponse.json({ error: 'Assinatura ausente.' }, { status: 400 })

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook inválido: ${err?.message ?? 'erro'}` }, { status: 400 })
  }

  const admin = createSupabaseAdminClient()
  
  if (!admin) {
    return NextResponse.json({ error: 'Supabase Admin não configurado.' }, { status: 500 })
  }

  // Atualiza status baseado em customer/subscription
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const customerId = session.customer as string | null
    const userId = (session.client_reference_id as string | null) ?? (session.metadata?.user_id as string | null)

    if (customerId) {
      const status = 'active'
      const payload = { subscription_status: status, plan: planFromStatus(status), stripe_customer_id: customerId }

      if (userId) {
        await admin.from('profiles').update(payload).eq('id', userId)
      } else {
        await admin.from('profiles').update(payload).eq('stripe_customer_id', customerId)
      }
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as any
    const customerId = sub.customer as string | null
    const mapped = mapStripeStatus(sub.status)

    if (customerId) {
      await admin
        .from('profiles')
        .update({ subscription_status: mapped, plan: planFromStatus(mapped) })
        .eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as any
    const customerId = invoice.customer as string | null

    if (customerId) {
      const status = 'active'
      await admin
        .from('profiles')
        .update({ subscription_status: status, plan: planFromStatus(status) })
        .eq('stripe_customer_id', customerId)
    }
  }

  return NextResponse.json({ received: true })
}

