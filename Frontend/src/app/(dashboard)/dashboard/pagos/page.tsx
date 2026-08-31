"use client";

import { useState, useEffect, useRef } from "react";
import { getAuthUser } from "@/lib/auth";
import { getTenantMpConfig, updateTenantMpConfig } from "@/lib/api";
import { motion } from "framer-motion";
import { CreditCard, Save, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, ExternalLink } from "lucide-react";

export default function PagosPage() {
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [showToken, setShowToken]   = useState(false);

  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey]     = useState("");
  const [userId, setUserId]           = useState("");
  const [sandbox, setSandbox]         = useState(true);
  const [enabled, setEnabled]         = useState(false);
  const [updatedAt, setUpdatedAt]     = useState<string | null>(null);

  const slugRef = useRef("");

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) {
      setLoading(false);
      return;
    }
    const slug = user.tenantSlug;
    slugRef.current = slug;

    getTenantMpConfig(slug)
      .then(data => {
        if (data) {
          setPublicKey(data.mpPublicKey ?? "");
          setUserId(data.mpUserId ?? "");
          setSandbox(data.mpSandbox ?? true);
          setEnabled(data.mpEnabled ?? false);
          setUpdatedAt(data.mpUpdatedAt ?? null);
        }
      })
      .catch(() => {/* 404 = no config todavía, ok */})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    const slug = slugRef.current;
    if (!slug) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const data = await updateTenantMpConfig(slug, {
        mpAccessToken: accessToken || undefined,
        mpPublicKey:   publicKey   || undefined,
        mpUserId:      userId      || undefined,
        mpSandbox:     sandbox,
        mpEnabled:     enabled,
      });
      if (data) {
        setPublicKey(data.mpPublicKey ?? publicKey);
        setUpdatedAt(data.mpUpdatedAt ?? null);
      }
      setAccessToken(""); // limpiar después de guardar
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.message ?? "Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos</h1>
          <p className="text-sm text-slate-500">Configura tu cuenta de Mercado Pago para recibir pagos directamente</p>
        </div>
      </div>

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex gap-3"
      >
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold mb-1">Pago directo a tu cuenta</p>
          <p className="text-blue-700">
            Cada venta se deposita <strong>directamente en tu cuenta de Mercado Pago</strong>.
            Canete solo procesa la transacción, no toca tu dinero.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5"
      >
        {/* Enable toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <span className="font-semibold text-slate-900">Activar Mercado Pago</span>
            <p className="text-xs text-slate-500">Cuando está activo, los clientes pueden pagar con tarjeta/Yape/PLIN</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-slate-300"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-6" : ""}`} />
          </button>
        </label>

        <div className={enabled ? "" : "opacity-50 pointer-events-none"}>
          {/* Sandbox toggle */}
          <label className="flex items-center justify-between cursor-pointer py-2">
            <div>
              <span className="font-medium text-slate-700">Modo sandbox (pruebas)</span>
              <p className="text-xs text-slate-500">Usa credenciales de prueba. Desactiva para recibir pagos reales.</p>
            </div>
            <button
              type="button"
              onClick={() => setSandbox(!sandbox)}
              className={`relative w-12 h-6 rounded-full transition-colors ${sandbox ? "bg-amber-500" : "bg-green-500"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sandbox ? "translate-x-6" : ""}`} />
            </button>
          </label>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Access Token {sandbox && <span className="text-amber-600">(de prueba)</span>}
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {updatedAt
                ? `Última actualización: ${new Date(updatedAt).toLocaleString("es-PE")}`
                : "Déjalo vacío para mantener el token actual"}
            </p>
          </div>

          {/* Public Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Public Key {sandbox && <span className="text-amber-600">(de prueba)</span>}
            </label>
            <input
              type="text"
              value={publicKey}
              onChange={e => setPublicKey(e.target.value)}
              placeholder="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* User ID (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              User ID <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              placeholder="123456789"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>

          {/* Help link */}
          <a
            href="https://www.mercadopago.com.pe/developers/panel/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            Obtener mis credenciales en Mercado Pago <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>

          {saved && (
            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Guardado
            </span>
          )}

          {error && (
            <span className="inline-flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </span>
          )}
        </div>
      </motion.div>
    </div>
    </div>
  );
}
