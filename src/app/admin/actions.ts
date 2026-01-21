'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/profile'

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

export async function seedPlans(_formData: FormData): Promise<void> {
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
        price_monthly: 5.5,
        price_yearly: 55,
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

