import { test, expect } from "@playwright/test";
import { TENANTS, waitForHydration } from "./helpers";

/**
 * Smoke tests — fast checks that the app loads and core pages render.
 * These run on every PR and should complete in < 30s.
 */

test.describe("Smoke tests", () => {
  test("homepage loads and shows hero content", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // The homepage should show the main heading or hero text
    await expect(page).toHaveTitle(/Cañete|Valle|Marketplace/i);

    // Should have navigation links
    await expect(page.locator("a").first()).toBeVisible();
  });

  test("marketplace page loads and shows tenants", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // The marketplace lists tenants as links with h3 headings
    // e.g. <a href="/alfajores"><h3>Zelita Alfajores</h3></a>
    const tenantHeading = page.locator("h3").first();
    await expect(tenantHeading).toBeVisible({ timeout: 15_000 });

    // Should show at least one known tenant
    await expect(page.locator("a[href*='/alfajores']")).toBeVisible();
  });

  test("tenant storefront loads for known slug", async ({ page }) => {
    await page.goto(`/${TENANTS.alfajores}`);
    await waitForHydration(page);

    // The storefront should show the tenant name
    await expect(page.locator("body")).not.toBeEmpty();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Login uses Google OAuth + tabs (Consumidor / Negocio)
    // Should have at least the Google sign-in button
    await expect(page.locator("text=/Google/i")).toBeVisible({ timeout: 10_000 });

    // Should have the consumer/business toggle
    await expect(page.locator("text=/Consumidor/i").first()).toBeVisible();
    await expect(page.locator("text=/Negocio/i").first()).toBeVisible();
  });

  test("API health check responds", async ({ request }) => {
    // The tenants list endpoint should return 200
    const res = await request.get("/api/tenants");
    expect(res.status()).toBe(200);

    const tenants = await res.json();
    expect(Array.isArray(tenants)).toBe(true);
    expect(tenants.length).toBeGreaterThan(0);
  });

  test("single tenant API returns expected shape", async ({ request }) => {
    const res = await request.get(`/api/tenants/${TENANTS.alfajores}`);
    expect(res.status()).toBe(200);

    const tenant = await res.json();
    expect(tenant).toHaveProperty("slug", TENANTS.alfajores);
    expect(tenant).toHaveProperty("name");
    expect(tenant).toHaveProperty("category");
    expect(tenant).toHaveProperty("openingHours");
  });
});
