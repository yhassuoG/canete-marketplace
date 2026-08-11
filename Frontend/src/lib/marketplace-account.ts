/**
 * Marketplace-level account session (global, not per-tenant).
 * Stored in localStorage under 'canete_marketplace_account'.
 */

export interface MarketplaceAccount {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  subscribedTenants: string[]; // tenant slugs
}

const KEY = 'canete_marketplace_account';

export function getMarketplaceAccount(): MarketplaceAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MarketplaceAccount) : null;
  } catch {
    return null;
  }
}

export function setMarketplaceAccount(account: MarketplaceAccount): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(account));
}

export function clearMarketplaceAccount(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}

export function addSubscription(tenantSlug: string): void {
  const acc = getMarketplaceAccount();
  if (!acc) return;
  if (!acc.subscribedTenants.includes(tenantSlug)) {
    acc.subscribedTenants = [...acc.subscribedTenants, tenantSlug];
    setMarketplaceAccount(acc);
  }
}
