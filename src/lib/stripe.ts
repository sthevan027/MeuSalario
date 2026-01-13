import Stripe from 'stripe'
import { env, requireEnv } from '@/lib/env'

export function getStripe() {
  return new Stripe(requireEnv('STRIPE_SECRET_KEY'))
}

export function getProPriceId(interval: 'month' | 'year') {
  const priceId =
    interval === 'month' ? env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY : env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY

  if (!priceId) throw new Error('Price ID do Stripe não configurado para o plano Pro.')
  return priceId
}

