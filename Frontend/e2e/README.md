# E2E Tests — Cañete Marketplace

Tests End-to-End con [Playwright](https://playwright.dev) para verificar los
flujos críticos del sistema.

## 🚀 Comandos

```bash
# Instalar navegadores (solo la primera vez)
npx playwright install chromium

# Correr todos los tests (auto-inicia Next.js dev server)
npm run test:e2e

# Modo interactivo (UI de Playwright)
npm run test:e2e:ui

# Ver el navegador mientras corre
npm run test:e2e:headed

# Solo smoke tests (rápidos)
npm run test:e2e:smoke

# Solo tests de configuración de tenant (regresión del bug jsonb)
npm run test:e2e:config

# Tests contra producción
npm run test:e2e:prod

# Ver reporte HTML del último run
npm run test:e2e:report
```

## 📁 Estructura

```
e2e/
├── helpers.ts              # Helpers compartidos (slugs, API calls, etc.)
├── smoke.spec.ts           # Smoke tests: páginas cargan, API responde
├── tenant-config.spec.ts   # PUT /config: regresión del bug jsonb
├── marketplace.spec.ts     # Flujos públicos: marketplace, storefront
├── auth.spec.ts            # Login: UI renderiza, validación
└── .gitignore              # Ignora artefactos de test
```

## 🎯 Qué cubren los tests

### `smoke.spec.ts`
- Homepage carga correctamente
- Marketplace muestra tenants
- Storefront de un tenant conocido carga
- Página de login renderiza
- API `/api/tenants` responde 200
- API devuelve la estructura esperada

### `tenant-config.spec.ts` — **Regresión del bug jsonb**
- PUT `/config` con body vacío `{}` → 200 (no 500)
- PUT `/config` con `openingHours` → guarda correctamente
- PUT `/config` con `name` → actualiza el nombre
- PUT `/config` con múltiples campos → todos se guardan
- PUT `/config` con yape/plin → guarda correctamente
- PUT `/config` con slug inválido → 404
- GET tenant devuelve `openingHours` como string JSON válido

### `marketplace.spec.ts`
- Visitante puede navegar el marketplace
- Visitante puede ver un storefront
- Navegación marketplace → storefront funciona
- Marketplace tiene filtros/búsqueda
- Storefront muestra información del negocio

### `auth.spec.ts`
- Página de login renderiza con tabs
- Formulario tiene campos email/password
- Botón de submit presente
- Validación con campos vacíos
- Opción de Google sign-in

## 🔧 Configuración

### Entornos
- **Local dev** (default): tests corren contra `http://localhost:3000`
  - Playwright auto-inicia `npm run dev`
  - El backend debe estar corriendo en `localhost:8080`
- **Producción**: `BASE_URL=https://vallecanete.com npm run test:e2e`
  - No inicia dev server, usa la URL directa

### CI (GitHub Actions)
- Workflow: `.github/workflows/e2e-tests.yml`
- Se ejecuta en cada PR que toca `Frontend/**`
- Smoke tests contra producción en cada push a `main`
- Artefactos (reporte HTML, resultados JSON) se suben por 7 días

## 🐛 Debug

```bash
# Modo debug (inspector de Playwright)
npx playwright test --debug

# Ver logs detallados
npx playwright test --verbose

# Solo un test específico
npx playwright test -g "PUT /config with empty body"

# Ver el trace de un test fallido
npx playwright show-trace test-results/.../trace.zip
```
