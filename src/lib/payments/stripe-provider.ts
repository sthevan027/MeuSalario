/**
 * Implementação do provedor de pagamento Stripe
 * Documentação: https://docs.stripe.com/
 */

import Stripe from 'stripe'
import type {
  PaymentProvider,
  CreateCustomerInput,
  CreateSubscriptionInput,
  CreateSubscriptionOutput,
  SubscriptionStatus,
  WebhookResult,
} from './payment-provider'
import { requireEnv } from '@/lib/env'

function toSubscriptionStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'ACTIVE'
    case 'past_due':
    case 'unpaid':
      return 'OVERDUE'
    case 'canceled':
    case 'incomplete_expired':
      return 'CANCELED'
    case 'incomplete':
    case 'paused':
      return 'PENDING'
    default:
      return 'PENDING'
  }
}

export class StripeProvider implements PaymentProvider {
  private stripe: Stripe

  constructor() {
    const secretKey = requireEnv('STRIPE_SECRET_KEY')
    this.stripe = new Stripe(secretKey)
  }

  async createCustomer(user: CreateCustomerInput): Promise<{ customerId: string }> {
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { user_id: user.id },
    })
    return { customerId: customer.id }
  }

  async createSubscription(data: CreateSubscriptionInput): Promise<CreateSubscriptionOutput> {
    const amountCents = Math.round(data.value * 100)
    const interval = data.interval === 'year' ? 'year' : 'month'

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: data.customerId,
      client_reference_id: data.userId ?? data.customerId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'MeuSalário Pro',
              description: data.interval === 'year' ? 'Plano Pro (anual)' : 'Plano Pro (mensal)',
            },
            unit_amount: amountCents,
            recurring: { interval },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/conta?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/app/conta?canceled=1`,
      subscription_data: {
        metadata: { plan_id: data.planId, user_id: data.userId ?? '' },
      },
      allow_promotion_codes: true,
    })

    return {
      subscriptionId: session.id,
      paymentLink: session.url!,
    }
  }

  async cancelSubscription(subscriptionId: string, immediately?: boolean): Promise<void> {
    if (immediately) {
      await this.stripe.subscriptions.cancel(subscriptionId)
    } else {
      await this.stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true })
    }
  }

  async getSubscription(subscriptionId: string): Promise<{
    id: string
    status: SubscriptionStatus
    currentPeriodEnd: Date | null
    cancelAtPeriodEnd: boolean
    interval: 'month' | 'year'
  } | null> {
    try {
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId)
      const firstItem = sub.items.data[0]
      const item = firstItem?.price
      const interval = item?.recurring?.interval === 'year' ? 'year' : 'month'
      const currentPeriodEnd = firstItem?.current_period_end
        ? new Date(firstItem.current_period_end * 1000)
        : null
      return {
        id: sub.id,
        status: toSubscriptionStatus(sub.status),
        currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        interval,
      }
    } catch {
      return null
    }
  }

  async handleWebhook(payload: string | Buffer, headers: Headers): Promise<WebhookResult | null> {
    const webhookSecret = requireEnv('STRIPE_WEBHOOK_SECRET')
    const sig = headers.get('stripe-signature')
    if (!sig) return null

    let event: Stripe.Event
    try {
      const body = typeof payload === 'string' ? payload : payload.toString()
      event = this.stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } catch {
      return null
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const subscriptionId = session.subscription as string
      const userId = session.client_reference_id || session.metadata?.user_id
      if (!userId || !subscriptionId) return null
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId)
      return {
        userId,
        status: toSubscriptionStatus(sub.status),
        subscriptionId: sub.id,
      }
    }

    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const userId = (sub.metadata as { user_id?: string })?.user_id
      if (!userId) return null
      return {
        userId,
        status: toSubscriptionStatus(sub.status),
        subscriptionId: sub.id,
      }
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const subRef = invoice.parent?.subscription_details?.subscription
      const subscriptionId = typeof subRef === 'string' ? subRef : (subRef as Stripe.Subscription)?.id
      if (!subscriptionId) return null
      const sub = await this.stripe.subscriptions.retrieve(subscriptionId)
      const userId = (sub.metadata as { user_id?: string })?.user_id
      if (!userId) return null
      const status = event.type === 'invoice.payment_failed' ? 'OVERDUE' : toSubscriptionStatus(sub.status)
      return {
        userId,
        status,
        subscriptionId: sub.id,
      }
    }

    return null
  }
}

let stripeProviderInstance: StripeProvider | null = null

export function getStripeProvider(): StripeProvider {
  if (!stripeProviderInstance) {
    stripeProviderInstance = new StripeProvider()
  }
  return stripeProviderInstance
}
