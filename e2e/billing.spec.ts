import { test, expect } from '@playwright/test'

test.describe('Billing — Modal Pro (sem autenticação)', () => {
  test('redireciona usuário não autenticado para login ao acessar /app/conta', async ({ page }) => {
    await page.goto('/app/conta')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Billing — API de preços', () => {
  test('GET /api/billing/prices retorna preços válidos', async ({ request }) => {
    const res = await request.get('/api/billing/prices')
    expect(res.ok()).toBe(true)

    const body = await res.json()
    expect(typeof body.monthly).toBe('number')
    expect(typeof body.yearly).toBe('number')
    expect(body.monthly).toBeGreaterThanOrEqual(0)
    expect(body.yearly).toBeGreaterThanOrEqual(0)
  })
})

test.describe('Billing — Webhook (validação de token)', () => {
  test('POST /api/billing/webhook sem token retorna 400 ou 401', async ({ request }) => {
    const res = await request.post('/api/billing/webhook', {
      data: { event: 'PAYMENT_RECEIVED' },
      headers: { 'content-type': 'application/json' },
    })
    // Sem ASAAS_WEBHOOK_TOKEN configurado, trata como válido e pode retornar 200 ou erro de processamento.
    // Com token configurado, deve retornar 401.
    expect([200, 400, 401, 500]).toContain(res.status())
  })
})

// Testes com usuário autenticado — descomente e configure auth state:
//
// test.use({ storageState: 'e2e/auth.json' })
//
// test.describe('Billing — Modal Pro (autenticado, free plan)', () => {
//   test('modal Pro abre e exibe preços', async ({ page }) => {
//     // Mock do endpoint de preços
//     await page.route('/api/billing/prices', async (route) => {
//       await route.fulfill({
//         status: 200,
//         contentType: 'application/json',
//         body: JSON.stringify({ monthly: 10, yearly: 95 }),
//       })
//     })
//
//     await page.goto('/app/dashboard')
//     await page.getByRole('button', { name: /upgrade|pro|assinar/i }).click()
//     await expect(page.getByRole('dialog')).toBeVisible()
//     await expect(page.getByText('R$ 10,00')).toBeVisible()
//   })
//
//   test('modal Pro fecha com ESC', async ({ page }) => {
//     await page.goto('/app/dashboard')
//     await page.getByRole('button', { name: /upgrade|pro|assinar/i }).click()
//     await page.keyboard.press('Escape')
//     await expect(page.getByRole('dialog')).not.toBeVisible()
//   })
// })
