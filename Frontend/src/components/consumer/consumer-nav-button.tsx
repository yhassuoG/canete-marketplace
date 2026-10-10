"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  MarketplaceAccount,
  getMarketplaceAccount,
  setMarketplaceAccount,
} from "@/lib/marketplace-account";
import { getApiBase } from "@/lib/api-base";
import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";
import { User, LogIn, X } from "lucide-react";

const API = getApiBase();

/**
 * Botón de navegación consciente del estado de sesión del consumidor.
 * - Si hay sesión: muestra "Mi cuenta" → /mi-cuenta
 * - Si no hay sesión: muestra "Iniciar sesión" → abre MODAL (no redirige a /login)
 *
 * El modal usa el mismo flujo de Google OAuth que el marketplace.
 * La página /login queda reservada para dueños de negocio (email/password).
 *
 * Se envuelve en TenantGoogleProvider para que useGoogleLogin funcione
 * incluso en páginas que no tienen el provider en su layout (ej. home).
 */
export function ConsumerNavButton({
  variant = "ghost",
}: {
  variant?: "ghost" | "solid";
}) {
  return (
    <TenantGoogleProvider>
      <ConsumerNavButtonInner variant={variant} />
    </TenantGoogleProvider>
  );
}

function ConsumerNavButtonInner({ variant = "ghost" }: { variant?: "ghost" | "solid" }) {
  const [account, setAccount] = useState<MarketplaceAccount | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAccount(getMarketplaceAccount());
    setHydrated(true);
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError(null);
      try {
        const userInfo = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        ).then((r) => r.json());

        const res = await fetch(`${API}/api/v1/marketplace/auth/google-access`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sub: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          }),
        });

        if (!res.ok) throw new Error("Error del servidor");
        const data = await res.json();

        const acc: MarketplaceAccount = {
          id: data.id,
          email: data.email,
          name: data.name,
          avatarUrl: data.avatarUrl ?? userInfo.picture ?? null,
          subscribedTenants: data.subscribedTenants ?? [],
        };
        setMarketplaceAccount(acc);
        setAccount(acc);
        setOpen(false);
      } catch {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Error con Google. Intenta de nuevo."),
  });

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
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition"
        style={
          variant === "solid"
            ? { background: "#0f172a", color: "white" }
            : { color: "#475569" }
        }
      >
        <LogIn className="h-4 w-4" />
        Iniciar sesión
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-semibold text-gray-900">
                Iniciar sesión
              </h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Ingresa para explorar tiendas, seguir tus pedidos y suscribirte a tus favoritas.
            </p>

            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              onClick={() => login()}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" />
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" />
                <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" />
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" />
              </svg>
              {loading ? "Ingresando..." : "Continuar con Google"}
            </button>

            <p className="mt-4 text-center text-xs text-gray-400">
              ¿Eres dueño de un negocio?{" "}
              <Link href="/login" className="font-medium text-gray-600 underline hover:text-gray-800" onClick={() => setOpen(false)}>
                Acceder como negocio
              </Link>
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
