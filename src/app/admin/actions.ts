'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/profile'
import { logAuditEvent } from '@/lib/audit'

async function getAdminIp(): Promise<string | null> {
  const h = await headers()
  return h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null
}

export async function updatePlanPrices(formData: FormData): Promise<void> {
  const admin_user = await requireAdmin()

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

  void logAuditEvent({
    userId: admin_user.id,
    action: 'admin.plan_prices_updated',
    resource: 'plan',
    resourceId: planId,
    metadata: { price_monthly: priceMonthly, price_yearly: priceYearly },
    ipAddress: await getAdminIp(),
  })

  revalidatePath('/admin/planos')
  revalidatePath('/planos')
}

export async function setUserPlan(formData: FormData): Promise<void> {
  const admin_user = await requireAdmin()

  const userId = String(formData.get('userId') ?? '')
  const plan = String(formData.get('plan') ?? 'free')

  if (!userId) return
  if (plan !== 'free' && plan !== 'pro') return

  const admin = createSupabaseAdminClient()
  if (!admin) return
  await admin.from('profiles').update({ plan }).eq('id', userId)

  void logAuditEvent({
    userId: admin_user.id,
    action: 'admin.user_plan_changed',
    resource: 'profile',
    resourceId: userId,
    metadata: { new_plan: plan },
    ipAddress: await getAdminIp(),
  })

  revalidatePath('/admin/usuarios')
}

export async function setUserRole(formData: FormData): Promise<void> {
  const admin_user = await requireAdmin()

  const userId = String(formData.get('userId') ?? '')
  const role = String(formData.get('role') ?? 'user')

  if (!userId) return
  if (role !== 'user' && role !== 'admin') return

  const admin = createSupabaseAdminClient()
  if (!admin) return
  await admin.from('profiles').update({ role }).eq('id', userId)

  void logAuditEvent({
    userId: admin_user.id,
    action: 'admin.user_role_changed',
    resource: 'profile',
    resourceId: userId,
    metadata: { new_role: role },
    ipAddress: await getAdminIp(),
  })

  revalidatePath('/admin/usuarios')
}

export async function seedPlans(formData: FormData): Promise<void> {
  void formData
  const admin_user = await requireAdmin()

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

  void logAuditEvent({
    userId: admin_user.id,
    action: 'admin.plans_seeded',
    resource: 'plan',
    metadata: { plans: ['free', 'pro'] },
    ipAddress: await getAdminIp(),
  })

  revalidatePath('/admin/planos')
}

