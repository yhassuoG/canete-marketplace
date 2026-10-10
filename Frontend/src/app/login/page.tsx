"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, LogIn, Store } from "lucide-react";
import {
  setAuthCookie,
  getAuthUser,
  type AuthUser,
} from "@/lib/auth";
import { fetchTenants } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";

/**
 * Página de login SOLO para dueños de negocio y admins (email/password).
 * Los consumidores (clientes) inician sesión mediante un modal de Google
 * que aparece en la misma página (home, marketplace, storefront) a través
 * del componente ConsumerNavButton / CustomerSignInButton.
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to the right place
  useEffect(() => {
    const user = getAuthUser();
    if (user) {
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [router]);

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
      const target = user.role === "admin" ? "/admin" : "/dashboard";
      // Reset loading before navigation so the button doesn't stay stuck
      // in the disabled state while the next route compiles (dev mode).
      setLoading(false);
      router.push(target);
    } catch {
      setError("No se pudo conectar con el servidor. Verifica que la API esté activa.");
      setLoading(false);
    }
  }

  return (
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.webp" alt="vallecanete" className="mb-4 h-14 w-14 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-2xl font-bold text-white">vallecanete</h1>
          <p className="mt-1 text-sm text-white/50">Panel de gestión de negocios</p>
        </motion.div>

        {/* ── BUSINESS LOGIN ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Acceder como negocio</h2>
              <p className="text-sm text-white/50">Gestiona tu tienda, productos y pedidos</p>
            </div>
          </div>

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

          <p className="mt-6 text-center text-xs text-white/40">
            ¿Eres cliente? Inicia sesión desde la página principal o el marketplace.
          </p>
        </motion.div>

      </div>
    </main>
  );
}
