/**
 * Customer session stored in localStorage (separate from business auth cookie).
 * Used by end-customers who visit storefronts to make reservations / orders.
 */

const KEY = "canete_customer";

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  loyalty: string;
  loyaltyPoints: number;
  tenantSlug: string;
}

export function getCustomerSession(tenantSlug: string): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${KEY}_${tenantSlug}`);
    return raw ? (JSON.parse(raw) as CustomerSession) : null;
  } catch {
    return null;
  }
}

export function setCustomerSession(session: CustomerSession): void {
  localStorage.setItem(`${KEY}_${session.tenantSlug}`, JSON.stringify(session));
}

export function clearCustomerSession(tenantSlug: string): void {
  localStorage.removeItem(`${KEY}_${tenantSlug}`);
}
