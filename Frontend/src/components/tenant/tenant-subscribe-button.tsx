"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  getMarketplaceAccount,
  addSubscription,
} from "@/lib/marketplace-account";
import { getApiBase } from "@/lib/api-base";

const API = getApiBase();

interface Props {
  tenantSlug: string;
  primaryColor?: string;
}

export function TenantSubscribeButton({ tenantSlug, primaryColor = "#2563eb" }: Props) {
  const [status, setStatus] = useState<"idle" | "subscribed" | "loading" | "no-account">("idle");
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    const acc = getMarketplaceAccount();
    if (!acc) {
      setStatus("no-account");
      return;
    }
    if (acc.subscribedTenants.includes(tenantSlug)) {
      setStatus("subscribed");
    } else {
      setStatus("idle");
    }
  }, [tenantSlug]);

  const handleSubscribe = async () => {
    const acc = getMarketplaceAccount();
    if (!acc) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API}/api/v1/marketplace/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: acc.id, tenantSlug }),
      });
      if (!res.ok) throw new Error();
      addSubscription(tenantSlug);
      setStatus("subscribed");
      setJustSubscribed(true);
    } catch {
      setStatus("idle");
    }
  };

  if (status === "no-account") {
    return (
      <Link
        href="/marketplace"
        className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
      >
        Crear cuenta
      </Link>
    );
  }

  if (status === "subscribed") {
    return (
      <span
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium"
        style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M2 7l3.5 3.5L12 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {justSubscribed ? "¡Suscrito!" : "Cliente"}
      </span>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={status === "loading"}
      className="rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ backgroundColor: primaryColor }}
    >
      {status === "loading" ? "..." : "Suscribirme"}
    </button>
  );
}
