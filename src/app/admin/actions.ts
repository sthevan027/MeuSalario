'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/profile'

export async function updatePlanPrices(formData: FormData): Promise<void> {
  await requireAdmin()

  const planId = String(formData.get('planId') ?? '')
  const priceMonthly = parseFloat(String(formData.get('priceMonthly') ?? '0'))
  const priceYearly = parseFloat(String(formData.get('priceYearly') ?? '0'))

  if (!planId) return

  const admin = createSupabaseAdminClient()
  if (!admin) return

  await admin
    .from('plans')
    .update({ 
      price_monthly: priceMonthly, 
      price_yearly: priceYearly 
    })
    .eq('id', planId)

  revalidatePath('/admin/planos')
  revalidatePath('/planos')
}

export async function setUserPlan(formData: FormData): Promise<void> {
  await requireAdmin()

  const userId = String(formData.get('userId') ?? '')
  const plan = String(formData.get('plan') ?? 'free')

  if (!userId) return
  if (plan !== 'free' && plan !== 'pro') return

  const admin = createSupabaseAdminClient()
  if (!admin) return
  await admin.from('profiles').update({ plan }).eq('id', userId)
  revalidatePath('/admin/usuarios')
}

export async function setUserRole(formData: FormData): Promise<void> {
  await requireAdmin()

  const userId = String(formData.get('userId') ?? '')
  const role = String(formData.get('role') ?? 'user')

  if (!userId) return
  if (role !== 'user' && role !== 'admin') return

  const admin = createSupabaseAdminClient()
  if (!admin) return
  await admin.from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/usuarios')
}

export async function seedPlans(formData: FormData): Promise<void> {
  void formData
  await requireAdmin()

  const admin = createSupabaseAdminClient()
  if (!admin) return

  await admin.from('plans').upsert(
    [
      {
        id: 'free',
        name: 'Free',
        price_monthly: 0,
        price_yearly: 0,
        features: {
          monthly_simulation: true,
          dashboard: true,
          history: false,
          charts: false,
          termination: false,
          compare: false,
          export: false,
        },
        active: true,
      },
      {
        id: 'pro',
        name: 'Pro',
        price_monthly: 10,
        price_yearly: 95,
        features: {
          monthly_simulation: true,
          dashboard: true,
          history: true,
          charts: true,
          termination: true,
          compare: true,
          export: true,
        },
        active: true,
      },
    ],
    { onConflict: 'id' }
  )
  revalidatePath('/admin/planos')
}

