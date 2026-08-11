"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Shield, ShoppingBag, Store } from "lucide-react";
import {
  setAuthCookie,
  getAuthUser,
  type AuthUser,
} from "@/lib/auth";
import { getMarketplaceAccount } from "@/lib/marketplace-account";
import { fetchTenants } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";
import { GoogleSignInButton } from "@/components/consumer/google-sign-in-button";
import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "admin@canete.app", password: "admin123", color: "#6366f1" },
  { label: "Muelle Pacífico", email: "muelle@demo.com", password: "demo123", color: "#0369a1" },
  { label: "Paraíso Lunahuaná", email: "paraiso@demo.com", password: "demo123", color: "#16a34a" },
  { label: "Viña del Sol", email: "vina@demo.com", password: "demo123", color: "#c2410c" },
  { label: "Hotel Luna", email: "hotel@demo.com", password: "demo123", color: "#4338ca" },
];

type Tab = "consumer" | "business";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("consumer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to the right place
  useEffect(() => {
    // Consumer already logged in → /mi-cuenta
    const consumer = getMarketplaceAccount();
    if (consumer && tab === "consumer") {
      router.replace("/mi-cuenta");
      return;
    }
    // Business/admin already logged in → /admin or /dashboard
    const user = getAuthUser();
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [router, tab]);

  function handleDemoLogin(acc: (typeof DEMO_ACCOUNTS)[0]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const emailNorm = email.trim().toLowerCase();

    try {
      const res = await fetch(`${getApiBase()}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailNorm, password }),
      });

      if (!res.ok) {
        setError("Correo o contraseña incorrectos");
        setLoading(false);
        return;
      }

      const data = await res.json() as { email: string; name: string; role: string; tenantSlug?: string };

      // Enrich with tenant theme data (name, color, gradient) from API
      let tenantName: string | undefined;
      let primaryColor: string | undefined;
      let gradient: string | undefined;

      if (data.tenantSlug) {
        const tenants = await fetchTenants();
        const tenant = tenants?.find((t) => t.slug === data.tenantSlug);
        if (tenant) {
          tenantName = tenant.name;
          primaryColor = tenant.primaryColor;
          gradient = tenant.gradient;
        }
      }

      const user: AuthUser = {
        email: data.email,
        name: data.name,
        role: data.role as AuthUser["role"],
        tenantSlug: data.tenantSlug ?? undefined,
        tenantName,
        primaryColor,
        gradient,
      };
      setAuthCookie(user);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("No se pudo conectar con el servidor. Verifica que la API esté activa.");
      setLoading(false);
    }
  }

  return (
    <TenantGoogleProvider>
      <main className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4 py-10">
        {/* Background blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col items-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-orange-500 shadow-lg shadow-orange-500/30">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <h1 className="text-2xl font-bold text-white">vallecanete</h1>
            <p className="mt-1 text-sm text-white/50">Explora, compra y reserva en Cañete</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/5 p-1"
          >
            <button
              type="button"
              onClick={() => { setTab("consumer"); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === "consumer"
                  ? "bg-gradient-to-br from-coral to-orange-500 text-white shadow-lg"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Consumidor
            </button>
            <button
              type="button"
              onClick={() => { setTab("business"); setError(""); }}
              className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                tab === "business"
                  ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              <Store className="h-4 w-4" />
              Negocio
            </button>
          </motion.div>

          {/* ── CONSUMER TAB ─────────────────────────────────────────────── */}
          {tab === "consumer" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <h2 className="text-lg font-bold text-white mb-1">Ingresar como consumidor</h2>
              <p className="text-sm text-white/50 mb-6">
                Compra, pide delivery, reserva y acumula puntos en tus tiendas favoritas.
              </p>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                >
                  {error}
                </motion.p>
              )}

              <GoogleSignInButton
                onSuccess={() => router.push("/mi-cuenta")}
                onError={(msg) => setError(msg)}
                label="Continuar con Google"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-60"
              />

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs text-white/30">o crea tu cuenta</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={() => router.push("/marketplace")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 hover:bg-white/10 transition"
              >
                <ShoppingBag className="h-4 w-4" />
                Explorar marketplace sin cuenta
              </button>

              <p className="mt-6 text-center text-xs text-white/40">
                Al continuar aceptas los Términos y la Política de privacidad de Cañete Marketplace.
              </p>
            </motion.div>
          )}

          {/* ── BUSINESS TAB ─────────────────────────────────────────────── */}
          {tab === "business" && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <h2 className="text-lg font-bold text-white mb-1">Panel de gestión</h2>
              <p className="text-sm text-white/50 mb-6">Accede al dashboard de tu negocio</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label htmlFor="login-email" className="mb-1.5 block text-xs font-medium text-white/60">
                    Correo electrónico
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="login-password" className="mb-1.5 block text-xs font-medium text-white/60">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-white/20 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" /> Ingresar
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Demo accounts (only on business tab) */}
          {tab === "business" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="mt-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-white/30" />
                <p className="text-xs font-medium text-white/30 uppercase tracking-widest">
                  Cuentas demo
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoLogin(acc)}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-left transition hover:border-white/15 hover:bg-white/10 group"
                  >
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: acc.color }}
                    >
                      {acc.label[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 group-hover:text-white transition">{acc.label}</p>
                      <p className="text-xs text-white/30">{acc.email}</p>
                    </div>
                    <span className="text-xs text-white/20 group-hover:text-white/50 transition font-mono">
                      {acc.password}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </TenantGoogleProvider>
  );
}
