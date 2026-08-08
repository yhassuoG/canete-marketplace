"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMarketplaceAccount } from "@/lib/marketplace-account";
import { User, LogIn } from "lucide-react";

/**
 * Botón de navegación consciente del estado de sesión del consumidor.
 * - Si hay sesión: muestra "Mi cuenta" → /mi-cuenta
 * - Si no hay sesión: muestra "Iniciar sesión" → /login
 */
export function ConsumerNavButton({
  variant = "ghost",
}: {
  variant?: "ghost" | "solid";
}) {
  const [account, setAccount] = useState<ReturnType<typeof getMarketplaceAccount>>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAccount(getMarketplaceAccount());
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Placeholder para evitar hydration mismatch
    return <span className="h-9 w-24" />;
  }

  if (account) {
    return (
      <Link
        href="/mi-cuenta"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
        style={
          variant === "solid"
            ? { background: "linear-gradient(135deg, #ff6b5b, #f97316)", color: "white" }
            : { color: "#0f172a" }
        }
      >
        <User className="h-4 w-4" />
        Mi cuenta
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
      style={
        variant === "solid"
          ? { background: "#0f172a", color: "white" }
          : { color: "#475569" }
      }
    >
      <LogIn className="h-4 w-4" />
      Iniciar sesión
    </Link>
  );
}
