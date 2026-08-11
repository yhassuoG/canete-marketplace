"use client";

import { useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import { X, LogIn, LogOut, User } from "lucide-react";
import {
  CustomerSession,
  getCustomerSession,
  setCustomerSession,
  clearCustomerSession,
} from "@/lib/customer-session";
import { getApiBase } from "@/lib/api-base";

const API = getApiBase();

interface Props {
  tenantSlug: string;
  primaryColor?: string;
}

export function CustomerSignInButton({ tenantSlug, primaryColor = "#0c4a6e" }: Props) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Read session on mount
  useEffect(() => {
    setSession(getCustomerSession(tenantSlug));
  }, [tenantSlug]);

  const handleGoogleToken = async (tokenResponse: { access_token: string }) => {
    setLoading(true);
    setError("");
    try {
      // Exchange access_token → id_token via Google userinfo, then send to backend
      // Use credential flow instead (handled by useGoogleLogin with id_token)
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
      );
      const userInfo = await userInfoRes.json() as {
        sub: string; email: string; name: string; picture: string;
      };

      // Call our backend with the Google sub directly (dev mode: trusts userinfo)
      const res = await fetch(`${API}/api/v1/customer-auth/google-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sub: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          tenantSlug,
        }),
      });

      if (!res.ok) throw new Error("Error del servidor");

      const customer = await res.json() as CustomerSession & { name: string; email: string };
      const sess: CustomerSession = {
        id:            customer.id,
        name:          customer.name,
        email:         customer.email,
        avatarUrl:     customer.avatarUrl ?? null,
        loyalty:       customer.loyalty ?? "bronze",
        loyaltyPoints: customer.loyaltyPoints ?? 0,
        tenantSlug,
      };
      setCustomerSession(sess);
      setSession(sess);
      setOpen(false);
    } catch (e) {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const login = useGoogleLogin({ onSuccess: handleGoogleToken });

  const handleSignOut = () => {
    clearCustomerSession(tenantSlug);
    setSession(null);
  };

  return (
    <>
      {/* Trigger button */}
      {session ? (
        <button
          onClick={() => setOpen(true)}
          className="glass-dark flex items-center gap-2 rounded-full px-3 py-1.5"
        >
          {session.avatarUrl ? (
            <img src={session.avatarUrl} alt={session.name}
              className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
          <span className="max-w-[96px] truncate text-xs font-medium text-white">
            {session.name.split(" ")[0]}
          </span>
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="glass-dark flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
        >
          <LogIn className="h-4 w-4" />
          Ingresar
        </button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", damping: 28 }}
              className="relative w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <p className="font-bold text-slate-800">
                  {session ? "Mi cuenta" : "Iniciar sesión"}
                </p>
                <button onClick={() => setOpen(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              <div className="px-6 py-6 space-y-4">
                {session ? (
                  /* Logged-in view */
                  <>
                    <div className="flex items-center gap-4">
                      {session.avatarUrl ? (
                        <img src={session.avatarUrl} alt={session.name}
                          className="h-14 w-14 rounded-full object-cover border-2 border-slate-100" />
                      ) : (
                        <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold text-white"
                          style={{ background: primaryColor }}>
                          {session.name[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800">{session.name}</p>
                        <p className="text-sm text-slate-400">{session.email}</p>
                        <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                          style={{ background: `${primaryColor}15`, color: primaryColor }}>
                          {session.loyalty} · {session.loyaltyPoints} pts
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  /* Sign-in view */
                  <>
                    <p className="text-sm text-slate-500 text-center">
                      Inicia sesión para hacer reservas, seguir tus pedidos y acumular puntos de fidelidad.
                    </p>

                    {error && (
                      <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 text-center">
                        {error}
                      </p>
                    )}

                    <button
                      onClick={() => login()}
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition"
                    >
                      {loading ? (
                        <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Continuar con Google
                    </button>

                    <p className="text-center text-xs text-slate-400">
                      Al ingresar aceptas recibir notificaciones de este negocio
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
