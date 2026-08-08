"use client";

import { useState, useCallback } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import Image from "next/image";
import {
  MarketplaceAccount,
  getMarketplaceAccount,
  setMarketplaceAccount,
  clearMarketplaceAccount,
} from "@/lib/marketplace-account";
import { getApiBase } from "@/lib/api-base";

const API = getApiBase();

interface Props {
  onAccountChange?: (account: MarketplaceAccount | null) => void;
}

export function MarketplaceSignInButton({ onAccountChange }: Props) {
  const [account, setAccount] = useState<MarketplaceAccount | null>(() =>
    typeof window !== "undefined" ? getMarketplaceAccount() : null
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        if (!res.ok) throw new Error("Error al registrar cuenta");
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
        onAccountChange?.(acc);
        setOpen(false);
      } catch {
        setError("No se pudo iniciar sesión. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Error con Google. Intenta de nuevo."),
  });

  const handleSignOut = useCallback(() => {
    clearMarketplaceAccount();
    setAccount(null);
    onAccountChange?.(null);
  }, [onAccountChange]);

  // ── Logged-in state ──────────────────────────────────────────────────────
  if (account) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors">
          {account.avatarUrl ? (
            <Image
              src={account.avatarUrl}
              alt={account.name}
              width={24}
              height={24}
              className="rounded-full"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30 text-xs font-bold">
              {account.name[0]}
            </span>
          )}
          <span className="hidden sm:inline max-w-[120px] truncate">{account.name}</span>
        </button>
        {/* Dropdown */}
        <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 min-w-[180px] rounded-xl border border-white/10 bg-gray-900 shadow-xl p-1">
          <div className="px-3 py-2 text-xs text-gray-400 border-b border-white/10">
            {account.email}
          </div>
          <div className="px-3 py-2 text-xs text-gray-400">
            {account.subscribedTenants.length === 0
              ? "Sin suscripciones aún"
              : `${account.subscribedTenants.length} tienda(s) suscritas`}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Sign-in button + modal ───────────────────────────────────────────────
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/20 transition-colors"
      >
        Ingresar
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Bienvenido al Marketplace
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Creá tu cuenta para explorar tiendas y suscribirte a tus favoritas.
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

            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
