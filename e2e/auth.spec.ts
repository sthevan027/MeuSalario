import { test, expect } from '@playwright/test'

test.describe('Autenticação', () => {
  test('exibe página de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/MeuSal[aá]rio|Login/i)
    await expect(page.getByRole('button', { name: /entrar|login|continuar/i })).toBeVisible()
  })

  test('redireciona usuário não autenticado para login ao acessar /app/dashboard', async ({ page }) => {
    await page.goto('/app/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('redireciona usuário não autenticado para login ao acessar /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/login/)
  })

  test('exibe formulário de cadastro', async ({ page }) => {
    await page.goto('/cadastro')
    await expect(page.locator('form')).toBeVisible()
  })

  test('exibe erro ao tentar login com credenciais inválidas', async ({ page }) => {
    await page.goto('/login')

    await page.fill('input[type="email"]', 'invalido@test.com')
    await page.fill('input[type="password"]', 'senhaerrada123')
    await page.getByRole('button', { name: /entrar|login|continuar/i }).click()

    await expect(page.getByRole('alert').or(page.locator('[class*="error"]').or(page.locator('[class*="rose"]')))).toBeVisible({ timeout: 10_000 })
  })
})
