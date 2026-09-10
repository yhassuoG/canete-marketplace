import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Cañete Marketplace E2E tests.
 *
 * Usage:
 *   npx playwright test              # run all tests
 *   npx playwright test --ui         # interactive UI mode
 *   npx playwright test --headed     # show browser
 *   npx playwright test project=smoke # only smoke tests
 *
 * Environments:
 *   - Local dev:  tests hit http://localhost:3000 (Next dev server)
 *   - Production: set BASE_URL=https://vallecanete.com to test prod
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const isProd = BASE_URL.includes("vallecanete.com");

export default defineConfig({
  // Test files: e2e/*.spec.ts
  testDir: "./e2e",

  // Parallelize tests for speed
  fullyParallel: !isProd, // serial in prod to avoid rate limits

  // Fail the build on CI if you accidentally left test.only in source
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Workers: 1 for prod (avoid rate limiting), local uses default
  workers: isProd ? 1 : undefined,

  // Reporter: HTML locally, line + JSON on CI
  reporter: process.env.CI
    ? [["line"], ["json", { outputFile: "e2e-results.json" }], ["html", { open: "never" }]]
    : "html",

  // Shared settings for all tests
  use: {
    baseURL: BASE_URL,

    // Capture screenshot + video on failure
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    trace: "retain-on-failure",

    // Timeout per test (30s) — generous for slow VPS / SSR pages
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Global timeout per test file
  timeout: 60_000,

  // Projects: organize tests into groups
  projects: [
    // ── Smoke tests: fast, run on every PR ──────────────────────────────
    {
      name: "smoke",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Tenant config: regression for the jsonb bug ─────────────────────
    {
      name: "tenant-config",
      testMatch: /tenant-config\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Marketplace: public-facing flows ───────────────────────────────
    {
      name: "marketplace",
      testMatch: /marketplace\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Auth: login flows ──────────────────────────────────────────────
    {
      name: "auth",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // ── Mobile: responsive checks ──────────────────────────────────────
    {
      name: "mobile",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["iPhone 14"] },
    },
  ],

  // Auto-start Next.js dev server for local tests
  // (only when not testing production)
  webServer: isProd
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000, // Next.js cold start can be slow
        stdout: "pipe",
        stderr: "pipe",
      },
});
