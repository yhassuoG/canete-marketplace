"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MarketplaceAccount,
  getMarketplaceAccount,
  setMarketplaceAccount,
  clearMarketplaceAccount,
  addSubscription,
  removeSubscription,
} from "@/lib/marketplace-account";

/**
 * Hook reactivo para la sesión del consumidor (cuenta global del marketplace).
 * Envuelve marketplace-account.ts y mantiene el estado sincronizado con localStorage.
 */
export function useConsumer() {
  const [account, setAccount] = useState<MarketplaceAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAccount(getMarketplaceAccount());
    setHydrated(true);
  }, []);

  // Escuchar cambios en otras pestañas
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "canete_marketplace_account") {
        setAccount(getMarketplaceAccount());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const login = useCallback((acc: MarketplaceAccount) => {
    setMarketplaceAccount(acc);
    setAccount(acc);
  }, []);

  const logout = useCallback(() => {
    clearMarketplaceAccount();
    setAccount(null);
  }, []);

  const subscribe = useCallback((tenantSlug: string) => {
    addSubscription(tenantSlug);
    setAccount(getMarketplaceAccount());
  }, []);

  const unsubscribe = useCallback((tenantSlug: string) => {
    removeSubscription(tenantSlug);
    setAccount(getMarketplaceAccount());
  }, []);

  return { account, hydrated, login, logout, subscribe, unsubscribe };
}
