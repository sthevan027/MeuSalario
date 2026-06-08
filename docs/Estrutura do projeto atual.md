# File Tree: MeuSalario

**Generated:** 17/03/2026, 22:31:45
**Root Path:** `p:\MeuSalario`

...
├── 📁 .github
│   ├── 📁 workflows
│   │   ├── ⚙️ ci.yml
│   │   └── ⚙️ lighthouse.yml
│   └── ⚙️ dependabot.yml
├── 📁 Docs
│   ├── 📝 RELATORIO_STATUS_PROJETO.md
│   ├── 📝 TODO.md
│   ├── 📝 plano-pwa-mobile.md
│   └── 📝 versionamento-semver.md
├── 📁 public
│   ├── 🖼️ next.svg
│   └── 🖼️ vercel.svg
├── 📁 src
│   ├── 📁 Public
│   │   └── 📄 favicon.ico
│   ├── 📁 app
│   │   ├── 📁 (auth)
│   │   │   ├── 📁 atualizar-senha
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 cadastro
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 login
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 recuperar-senha
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 actions.ts
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 admin
│   │   │   ├── 📁 planos
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 usuarios
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 actions.ts
│   │   │   ├── 📄 layout.tsx
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 api
│   │   │   ├── 📁 billing
│   │   │   │   ├── 📁 cancel
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 checkout
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 manage
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   ├── 📁 prices
│   │   │   │   │   └── 📄 route.ts
│   │   │   │   └── 📁 webhook
│   │   │   │       └── 📄 route.ts
│   │   │   └── 📁 feedback
│   │   │       └── 📄 route.ts
│   │   ├── 📁 app
│   │   │   ├── 📁 admin
│   │   │   │   └── 📁 [[...path]]
│   │   │   │       └── 📄 page.tsx
│   │   │   ├── 📁 atualizacoes
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 comparador
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 conta
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 decimo-terceiro
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 ferias
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 historico
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 rescisao
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📁 simulacao
│   │   │   │   └── 📄 page.tsx
│   │   │   ├── 📄 actions.ts
│   │   │   └── 📄 layout.tsx
│   │   ├── 📁 atualizacoes
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 auth
│   │   │   ├── 📁 callback
│   │   │   │   └── 📄 route.ts
│   │   │   └── 📁 clear-session
│   │   │       └── 📄 route.ts
│   │   ├── 📁 como-funciona
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 faq
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 planos
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 privacidade
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 setup
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 termos
│   │   │   └── 📄 page.tsx
│   │   ├── 🖼️ apple-icon.png
│   │   ├── 🎨 globals.css
│   │   ├── 🖼️ icon.png
│   │   ├── 📄 layout.tsx
│   │   └── 📄 page.tsx
│   ├── 📁 components
│   │   ├── 📁 account
│   │   │   └── 📄 LinkedAccounts.tsx
│   │   ├── 📁 admin
│   │   │   ├── 📄 AdminCharts.tsx
│   │   │   ├── 📄 PeriodFilter.tsx
│   │   │   └── 📄 UserFilters.tsx
│   │   ├── 📁 auth
│   │   │   ├── 📄 GoogleAuthButton.tsx
│   │   │   ├── 📄 LoginForm.tsx
│   │   │   ├── 📄 ResetPasswordForm.tsx
│   │   │   ├── 📄 SignupForm.tsx
│   │   │   ├── 📄 UpdatePasswordForm.tsx
│   │   │   └── 📄 ValidateCodeForm.tsx
│   │   ├── 📁 billing
│   │   │   ├── 📄 CancelSubscription.tsx
│   │   │   ├── 📄 ManageSubscription.tsx
│   │   │   ├── 📄 PaywallCard.tsx
│   │   │   ├── 📄 SubscribeButtons.tsx
│   │   │   ├── 📄 UpgradeButton.tsx
│   │   │   ├── 📄 UpgradeCta.tsx
│   │   │   └── 📄 UpgradeModal.tsx
│   │   ├── 📁 charts
│   │   │   ├── 📄 AnnualForecastChart.tsx
│   │   │   ├── 📄 CltVsPjChart.tsx
│   │   │   ├── 📄 DeductionsChart.tsx
│   │   │   ├── 📄 LazyChart.tsx
│   │   │   └── 📄 MonthlyNetChart.tsx
│   │   ├── 📁 dashboard
│   │   │   ├── 📄 AnnualForecast.tsx
│   │   │   ├── 📄 DashboardStats.tsx
│   │   │   └── 📄 SavingsMetrics.tsx
│   │   ├── 📁 historico
│   │   │   ├── 📄 HistoryFilters.tsx
│   │   │   └── 📄 HistoryTable.tsx
│   │   ├── 📁 layout
│   │   │   ├── 📄 AdminMobileMenu.tsx
│   │   │   ├── 📄 AdminNavLink.tsx
│   │   │   ├── 📄 AppLayoutClient.tsx
│   │   │   ├── 📄 CollapsibleNavGroup.tsx
│   │   │   ├── 📄 Header.tsx
│   │   │   ├── 📄 MobileMenu.tsx
│   │   │   ├── 📄 MobileMenuButton.tsx
│   │   │   └── 📄 NavLink.tsx
│   │   ├── 📁 public
│   │   │   └── 📄 QuickSimulator.tsx
│   │   ├── 📁 simulations
│   │   │   ├── 📄 CompareForm.tsx
│   │   │   ├── 📄 DeleteSimulationButton.tsx
│   │   │   ├── 📄 ExportButtons.tsx
│   │   │   ├── 📄 MonthlySimulationForm.tsx
│   │   │   ├── 📄 ResultBreakdown.tsx
│   │   │   ├── 📄 TerminationForm.tsx
│   │   │   ├── 📄 ThirteenthForm.tsx
│   │   │   └── 📄 VacationForm.tsx
│   │   ├── 📁 ui
│   │   │   ├── 📄 Button.tsx
│   │   │   ├── 📄 Field.tsx
│   │   │   ├── 📄 Input.tsx
│   │   │   └── 📄 PasswordInput.tsx
│   │   └── 📄 FeedbackForm.tsx
│   ├── 📁 lib
│   │   ├── 📁 auth
│   │   │   └── 📄 profile.ts
│   │   ├── 📁 calculators
│   │   │   ├── 📁 __tests__
│   │   │   │   ├── 📄 tax.test.ts
│   │   │   │   ├── 📄 termination.test.ts
│   │   │   │   └── 📄 utils.test.ts
│   │   │   ├── 📄 compare.ts
│   │   │   ├── 📄 monthly.ts
│   │   │   ├── 📄 schemas.ts
│   │   │   ├── 📄 tax.ts
│   │   │   ├── 📄 termination.ts
│   │   │   ├── 📄 thirteenth.ts
│   │   │   ├── 📄 types.ts
│   │   │   ├── 📄 utils.ts
│   │   │   └── 📄 vacation.ts
│   │   ├── 📁 payments
│   │   │   ├── 📄 asaas-provider.ts
│   │   │   ├── 📄 index.ts
│   │   │   └── 📄 payment-provider.ts
│   │   ├── 📁 supabase
│   │   │   ├── 📄 admin.ts
│   │   │   ├── 📄 client.ts
│   │   │   └── 📄 server.ts
│   │   ├── 📄 env.ts
│   │   ├── 📄 export.ts
│   │   ├── 📄 format.ts
│   │   ├── 📄 greetings.ts
│   │   ├── 📄 last-salary.ts
│   │   ├── 📄 number.ts
│   │   ├── 📄 polyfills.ts
│   │   └── 📄 sentry.ts
│   ├── 📁 types
│   │   └── 📄 react-dom-experimental.d.ts
│   └── 📄 middleware.ts
├── 📁 supabase
│   └── 📄 schema.sql
├── ⚙️ .eslintrc.json
├── ⚙️ .gitignore
├── ⚙️ .npmrc
├── 📝 README.md
├── 📄 env.example
├── 📄 eslint.config.mjs
├── 📄 instrumentation.ts
├── ⚙️ lighthouserc.json
├── 📄 next.config.js
├── ⚙️ package.json
├── ⚙️ pnpm-lock.yaml
├── 📄 polyfills-server.js
├── 📄 postcss.config.js
├── 📄 server-polyfills.js
├── 📄 tailwind.config.ts
├── 📄 test-tax-calc.js
├── ⚙️ tsconfig.json
└── 📄 vitest.config.ts
```