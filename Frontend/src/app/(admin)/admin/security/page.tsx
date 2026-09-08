"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Lock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Ban,
  Trash2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  fetchSecurityStatus,
  unblockIp,
  type SecurityStatus,
  type BlockedIpInfo,
} from "@/lib/api";

export default function AdminSecurityPage() {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const data = await fetchSecurityStatus();
    if (data) {
      setStatus(data);
    } else {
      setError("No se pudo conectar con la API de seguridad");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Refresh every 30 seconds
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleUnblock = async (ip: string) => {
    setUnblocking(ip);
    const result = await unblockIp(ip);
    if (result.ok) {
      await load();
    } else {
      setError(`Error al desbloquear ${ip}: ${result.error}`);
    }
    setUnblocking(null);
  };

  if (loading && !status) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-3">Cargando estado de seguridad…</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-sm text-slate-600 mt-3">{error}</p>
          <button
            onClick={load}
            className="mt-4 px-4 py-2 rounded-xl bg-[#083d77] text-white text-sm font-semibold hover:bg-[#1a5ba8]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const score = status?.score ?? 0;
  const scoreColor =
    score >= 90 ? "from-emerald-600 to-emerald-800" : score >= 70 ? "from-[#083d77] to-[#1a5ba8]" : "from-amber-500 to-amber-700";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Seguridad</h1>
          <p className="text-sm text-slate-400 mt-1">Estado de seguridad del sistema en tiempo real</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      {/* Security score */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl bg-gradient-to-br ${scoreColor} p-8 text-white`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Puntuación de seguridad</p>
            <p className="text-6xl font-bold mt-2">
              {score}
              <span className="text-2xl font-normal text-white/60">/{status?.scoreMax ?? 100}</span>
            </p>
            <p className="mt-2 text-white/70 text-sm">
              {score >= 90 ? "Excelente" : score >= 70 ? "Buena" : "Necesita atención"} —{" "}
              {status?.okCount ?? 0} de {status?.totalMeasures ?? 0} medidas activas
            </p>
          </div>
          <Shield className="h-24 w-24 text-white/20" />
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {(status?.measures ?? []).map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2" title={item.detail}>
              {item.status === "ok" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              ) : item.status === "warn" ? (
                <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              )}
              <span className="text-sm text-white/80 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Security measures detail */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden"
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <Lock className="h-4 w-4 text-[#083d77]" />
          <h3 className="font-semibold text-ink">Medidas de seguridad activas</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {(status?.measures ?? []).map((m) => (
            <div key={m.id} className="flex items-start gap-3 px-6 py-4 hover:bg-slate-50">
              {m.status === "ok" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              ) : m.status === "warn" ? (
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-medium text-ink">{m.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{m.detail}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  m.status === "ok"
                    ? "bg-emerald-50 text-emerald-600"
                    : m.status === "warn"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {m.status === "ok" ? "Activo" : m.status === "warn" ? "Advertencia" : "Inactivo"}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rate limiting stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <Activity className="h-4 w-4 text-[#083d77]" />
            <h3 className="font-semibold text-ink">Rate Limiting</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                label="Bloqueos totales"
                value={status?.rateLimit.totalBlockedRequests ?? 0}
                color="text-red-500"
              />
              <StatCard
                label="IPs rastreadas"
                value={status?.rateLimit.currentlyTrackedIps ?? 0}
                color="text-[#083d77]"
              />
              <StatCard
                label="IPs bloqueadas"
                value={status?.rateLimit.blockedIpsCount ?? 0}
                color="text-amber-500"
              />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Límites por categoría (por IP)</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(status?.rateLimit.limits ?? {}).map(([cat, limit]) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                  >
                    <span className="text-xs text-slate-500">{cat}</span>
                    <span className="text-xs font-semibold text-ink">
                      {limit}/{status?.rateLimit.windowSeconds ?? 60}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Blocked IPs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden"
        >
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <Ban className="h-4 w-4 text-red-500" />
            <h3 className="font-semibold text-ink">IPs bloqueadas (última hora)</h3>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            {(status?.rateLimit.topBlockedIps ?? []).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-sm text-slate-400 mt-2">No hay IPs bloqueadas</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50 sticky top-0 bg-white">
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">IP</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Categoría</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Bloqueos</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Última vez</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(status?.rateLimit.topBlockedIps ?? []).map((t: BlockedIpInfo) => (
                    <tr key={t.ip} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-xs text-ink">{t.ip}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            t.category === "auth"
                              ? "bg-red-50 text-red-600"
                              : t.category === "payment"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {t.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-ink">{t.blockCount}</td>
                      <td className="px-5 py-3 text-xs text-slate-400">
                        {new Date(t.lastBlockedAt).toLocaleTimeString("es-PE")}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleUnblock(t.ip)}
                          disabled={unblocking === t.ip}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
                        >
                          <Trash2 className="h-3 w-3" />
                          {unblocking === t.ip ? "…" : "Desbloquear"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer note */}
      <div className="rounded-2xl bg-slate-100 px-4 py-3 flex items-center gap-2 text-xs text-slate-400">
        <Globe className="h-4 w-4" />
        Datos en tiempo real desde el backend · Actualización automática cada 30s
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
