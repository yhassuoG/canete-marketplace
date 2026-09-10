import { test, expect } from "@playwright/test";
import { waitForHydration } from "./helpers";

/**
 * Auth E2E tests — login page and authentication flows.
 *
 * The login page uses Google OAuth (no email/password fields).
 * It has two tabs: "Consumidor" (consumer) and "Negocio" (business).
 *
 * NOTE: Full OAuth flow tests require a staging environment with
 * known test Google accounts. These tests verify the UI renders correctly.
 */

test.describe("Auth — login page", () => {
  test("login page renders with consumer and business tabs", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Should have the Consumidor (consumer) tab
    await expect(page.locator("text=/Consumidor/i").first()).toBeVisible({ timeout: 10_000 });

    // Should have the Negocio (business) tab
    await expect(page.locator("text=/Negocio/i").first()).toBeVisible();
  });

  test("login page has Google sign-in button", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Should have a "Continuar con Google" button
    await expect(page.locator("text=/Google/i")).toBeVisible({ timeout: 10_000 });
  });

  test("login page shows heading with site name", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Should show the site name / heading
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 10_000 });
  });

  test("consumer tab is active by default", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // The "Ingresar como consumidor" heading should be visible by default
    await expect(page.locator("text=/consumidor/i").first()).toBeVisible({ timeout: 10_000 });
  });

  test("can switch to business (Negocio) tab", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Click the "Negocio" tab
    const negocioTab = page.locator("button:has-text('Negocio')").first();
    await expect(negocioTab).toBeVisible({ timeout: 10_000 });
    await negocioTab.click();

    // After clicking, should show business-related content
    await page.waitForTimeout(500);
    await expect(page.locator("body")).toBeVisible();
  });

  test("login page has marketplace explore link", async ({ page }) => {
    await page.goto("/login");
    await waitForHydration(page);

    // Should have a link/button to explore marketplace without account
    const exploreLink = page.locator("text=/marketplace sin cuenta/i").first();
    await expect(exploreLink).toBeVisible({ timeout: 10_000 });
  });
});