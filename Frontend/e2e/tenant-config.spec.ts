import { test, expect } from "@playwright/test";
import { TENANTS, VALID_OPENING_HOURS, apiFetch } from "./helpers";

/**
 * Tenant config regression tests.
 *
 * These tests verify that PUT /api/tenants/{slug}/config works correctly.
 *
 * Background: The opening_hours column is PostgreSQL jsonb. Without
 * @JdbcTypeCode(SqlTypes.JSON), Hibernate bound the String as VARCHAR
 * and PostgreSQL rejected the implicit cast, causing a 500 error on
 * EVERY config update — even with an empty body {}.
 *
 * These tests guard against regressions of that bug.
 */

const SLUG = TENANTS.alfajores;

test.describe("Tenant config API — jsonb regression", () => {
  test("PUT /config with empty body returns 200 (not 500)", async ({ request }) => {
    // This was the original bug: even {} caused 500 because Hibernate
    // tried to UPDATE all columns including opening_hours (jsonb)
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}/config`, {
      method: "PUT",
      body: {},
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty("slug", SLUG);
  });

  test("PUT /config with openingHours saves correctly", async ({ request }) => {
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}/config`, {
      method: "PUT",
      body: { openingHours: VALID_OPENING_HOURS },
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty("slug", SLUG);

    // Verify the openingHours were saved by reading back
    const { status: getStatus, data: getData } = await apiFetch(
      request,
      `/api/tenants/${SLUG}`
    );
    expect(getStatus).toBe(200);
    const tenant = getData as { openingHours?: string };
    expect(tenant.openingHours).toBeTruthy();

    // The saved value should contain our hours
    const parsed = JSON.parse(tenant.openingHours!);
    expect(parsed.mon.open).toBe("09:00");
    expect(parsed.fri.close).toBe("21:00");
  });

  test("PUT /config with name updates tenant name", async ({ request }) => {
    const originalName = "Zelita Alfajores";

    // Update name
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}/config`, {
      method: "PUT",
      body: { name: originalName },
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty("name", originalName);
  });

  test("PUT /config with multiple fields updates all", async ({ request }) => {
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}/config`, {
      method: "PUT",
      body: {
        name: "Zelita Alfajores",
        tagline: "Alfajores artesanales rellenos de dulce de leche",
        openingHours: VALID_OPENING_HOURS,
        allowsDelivery: true,
        allowsPickup: true,
        cashEnabled: true,
      },
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty("slug", SLUG);
    expect(data).toHaveProperty("allowsDelivery", true);
    expect(data).toHaveProperty("cashEnabled", true);
  });

  test("PUT /config with yape/plin fields saves correctly", async ({ request }) => {
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}/config`, {
      method: "PUT",
      body: {
        yapeEnabled: false,
        yapePhone: "+51 955 006 006",
        plinEnabled: false,
      },
    });

    expect(status).toBe(200);
    expect(data).toHaveProperty("yapeEnabled", false);
    expect(data).toHaveProperty("plinEnabled", false);
  });

  test("PUT /config with invalid slug returns 404", async ({ request }) => {
    const { status } = await apiFetch(
      request,
      `/api/tenants/nonexistent-tenant-xyz/config`,
      { method: "PUT", body: {} }
    );

    expect(status).toBe(404);
  });

  test("GET tenant includes openingHours as string", async ({ request }) => {
    const { status, data } = await apiFetch(request, `/api/tenants/${SLUG}`);
    expect(status).toBe(200);

    const tenant = data as { openingHours?: string };
    expect(tenant.openingHours).toBeDefined();
    expect(typeof tenant.openingHours).toBe("string");

    // Should be valid JSON
    expect(() => JSON.parse(tenant.openingHours!)).not.toThrow();
  });
});
