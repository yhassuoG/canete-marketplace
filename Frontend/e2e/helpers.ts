/**
 * Shared helpers for E2E tests.
 */

/**
 * Tenant slugs available in the seed data.
 * These match the DB seed (03_seed.sql) and are stable across environments.
 */
export const TENANTS = {
  alfajores: "alfajores",
  muellePacifico: "muelle-pacifico",
} as const;

/**
 * Default timeout for API-based assertions (polling).
 */
export const API_TIMEOUT = 10_000;

/**
 * Wait for the Next.js page to be fully hydrated.
 * Next.js app router sets a data attribute when hydration completes.
 */
export async function waitForHydration(page: import("@playwright/test").Page) {
  // Wait for the main content to be present (works for most pages)
  await page.waitForLoadState("networkidle");
}

/**
 * Make a direct API call to the backend, bypassing the UI.
 * Uses the same base URL as the browser context.
 */
export async function apiFetch(
  request: import("@playwright/test").APIRequestContext,
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<{ status: number; data: unknown }> {
  const res = await request.fetch(path, {
    method: options?.method ?? "GET",
    headers: options?.body
      ? { "Content-Type": "application/json" }
      : undefined,
    data: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status(), data };
}

/**
 * Valid opening hours JSON for testing the config endpoint.
 * This is the shape the frontend sends when saving business hours.
 */
export const VALID_OPENING_HOURS = JSON.stringify({
  mon: { open: "09:00", close: "20:00" },
  tue: { open: "09:00", close: "20:00" },
  wed: { open: "09:00", close: "20:00" },
  thu: { open: "09:00", close: "20:00" },
  fri: { open: "09:00", close: "21:00" },
  sat: { open: "09:00", close: "21:00" },
  sun: { open: "10:00", close: "18:00" },
});
