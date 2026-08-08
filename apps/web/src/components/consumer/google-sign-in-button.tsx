"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { MarketplaceAccount, setMarketplaceAccount } from "@/lib/marketplace-account";
import { getApiBase } from "@/lib/api-base";

const API = getApiBase();

interface Props {
  onSuccess: (account: MarketplaceAccount) => void;
  onError?: (msg: string) => void;
  label?: string;
  className?: string;
}

/**
 * Botón "Continuar con Google" que crea/actualiza la cuenta global del marketplace.
 * Reutiliza el mismo endpoint que marketplace-sign-in-button.tsx:
 *   POST /api/v1/marketplace/auth/google-access
 */
export function GoogleSignInButton({ onSuccess, onError, label = "Continuar con Google", className }: Props) {
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
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
        onSuccess(acc);
      } catch {
        onError?.("No se pudo iniciar sesión con Google. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => onError?.("Error con Google. Intenta de nuevo."),
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={loading}
      className={
        className ??
        "flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
      }
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      ) : (
        <>
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}
