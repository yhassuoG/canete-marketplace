import { test, expect } from "@playwright/test";
import { TENANTS, waitForHydration } from "./helpers";

/**
 * Marketplace E2E tests — public-facing flows that visitors perform.
 */

test.describe("Marketplace — public flows", () => {
  test("visitor can browse the marketplace", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // Page should load with the marketplace heading
    await expect(page.locator("h1")).toHaveText(/Marketplace/i);

    // Should not show an error message
    const errorText = page.locator("text=/error|failed|500|exception/i");
    await expect(errorText).toHaveCount(0);
  });

  test("marketplace shows tenant cards with names", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // Should show tenant names as h3 headings inside links
    const tenantLink = page.locator(`a[href*="/${TENANTS.alfajores}"]`);
    await expect(tenantLink).toBeVisible({ timeout: 15_000 });

    // The link should contain the tenant name
    await expect(tenantLink.locator("h3")).toHaveText(/Zelita Alfajores/i);
  });

  test("marketplace shows category filter buttons", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // Should have category filter buttons
    await expect(page.locator("button:has-text('Restaurantes')")).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("button:has-text('Hospedajes')")).toBeVisible();
  });

  test("marketplace has search input", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // Should have a search textbox
    const searchInput = page.locator("input[type='text'], input[placeholder*='Buscar']").first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test("visitor can navigate from marketplace to a tenant", async ({ page }) => {
    await page.goto("/marketplace");
    await waitForHydration(page);

    // Click the link to the alfajores tenant
    const tenantLink = page.locator(`a[href*="/${TENANTS.alfajores}"]`).first();
    await expect(tenantLink).toBeVisible({ timeout: 15_000 });
    await tenantLink.click();

    // Should navigate to the tenant storefront
    await page.waitForURL(`**/${TENANTS.alfajores}**`, { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(TENANTS.alfajores));
  });

  test("tenant storefront loads and shows content", async ({ page }) => {
    await page.goto(`/${TENANTS.alfajores}`);
    await waitForHydration(page);

    // Should not be a 404 / error page
    await expect(page.locator("text=/not found|404/i")).toHaveCount(0);

    // Should have meaningful content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(100);
  });
});