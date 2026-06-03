import { test, expect } from '@playwright/test'

// Testes de simulação requerem usuário autenticado.
// Para CI, configure PLAYWRIGHT_TEST_EMAIL e PLAYWRIGHT_TEST_PASSWORD,
// ou use o storage state (ver scripts/create-auth-state.ts).

test.describe('Simulação Mensal (sem autenticação)', () => {
  test('redireciona para login ao acessar /app/simulacao/mensal', async ({ page }) => {
    await page.goto('/app/simulacao/mensal')
    await expect(page).toHaveURL(/login/)
  })

  test('redireciona para login ao acessar /app/comparacao', async ({ page }) => {
    await page.goto('/app/comparacao')
    await expect(page).toHaveURL(/login/)
  })
})

test.describe('Calculadoras (rotas públicas ou roteamento)', () => {
  test('página inicial redireciona ou exibe conteúdo', async ({ page }) => {
    await page.goto('/')
    // Ou exibe landing page ou redireciona para login/dashboard
    const url = page.url()
    expect(url).toMatch(/localhost|login|dashboard/)
  })
})

// Testes com usuário autenticado — descomente e configure auth state:
//
// test.use({ storageState: 'e2e/auth.json' })
//
// test.describe('Simulação Mensal (autenticado)', () => {
//   test('renderiza formulário de simulação CLT', async ({ page }) => {
//     await page.goto('/app/simulacao/mensal')
//     await expect(page.locator('form')).toBeVisible()
//     await expect(page.getByText(/sal[aá]rio/i)).toBeVisible()
//   })
//
//   test('calcula simulação CLT e exibe resultado', async ({ page }) => {
//     await page.goto('/app/simulacao/mensal')
//     await page.fill('input[name="salarioBruto"]', '5000')
//     await page.getByRole('button', { name: /calcular|simular/i }).click()
//     await expect(page.getByText(/sal[aá]rio l[ií]quido/i)).toBeVisible()
//   })
// })
