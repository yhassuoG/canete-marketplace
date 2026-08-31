"use client";

import { motion } from "framer-motion";
import { Shield, Lock, Globe, AlertTriangle, CheckCircle2, Key } from "lucide-react";

const THREATS = [
  { ip: "185.220.101.45", country: "RU", attempts: 23, action: "Bloqueado", severity: "high" },
  { ip: "45.155.205.31", country: "CN", attempts: 8, action: "Monitoreado", severity: "medium" },
  { ip: "104.21.44.187", country: "US", attempts: 3, action: "Monitoreado", severity: "low" },
];

export default function AdminSecurityPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Seguridad</h1>
        <p className="text-sm text-slate-400 mt-1">Estado de seguridad y amenazas detectadas</p>
      </div>

      {/* Security score */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-to-br from-[#083d77] to-[#1a5ba8] p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Puntuación de seguridad</p>
            <p className="text-6xl font-bold mt-2">87<span className="text-2xl font-normal text-white/60">/100</span></p>
            <p className="mt-2 text-white/70 text-sm">Buena — 2 mejoras recomendadas</p>
          </div>
          <Shield className="h-24 w-24 text-white/20"/>
        </div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "SSL/TLS", status: "ok" }, { label: "2FA Admin", status: "ok" },
            { label: "Backups", status: "warn" }, { label: "Rate Limiting", status: "ok" },
            { label: "IP Whitelist", status: "warn" }, { label: "Auditoría", status: "ok" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              {item.status === "ok"
                ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0"/>
                : <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0"/>}
              <span className="text-sm text-white/80">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Threats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <Globe className="h-4 w-4 text-red-500"/>
            <h3 className="font-semibold text-ink">IPs sospechosas bloqueadas</h3>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">IP</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">País</th>
              <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">Intentos</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Acción</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {THREATS.map((t) => (
                <tr key={t.ip} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-xs text-ink">{t.ip}</td>
                  <td className="px-5 py-3 text-slate-500">{t.country}</td>
                  <td className="px-5 py-3 text-right font-semibold text-ink">{t.attempts}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.severity === "high" ? "bg-red-50 text-red-600" : t.severity === "medium" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}>
                      {t.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </motion.div>

        {/* API Keys */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-3"><Key className="h-4 w-4 text-violet-500"/><h3 className="font-semibold text-ink">API Keys activas</h3></div>
            <button className="text-xs font-semibold text-[#083d77]">+ Nueva key</button>
          </div>
          <ul className="divide-y divide-slate-50">
            {[
              { name: "Hotel Luna · Producción", key: "sk_live_••••••••••••3847", created: "10 Ene 2026", scope: "read/write" },
              { name: "Muelle Pacifico · Prod", key: "sk_live_••••••••••••9012", created: "15 Feb 2026", scope: "read" },
              { name: "Dashboard interno", key: "sk_live_••••••••••••1156", created: "01 Mar 2026", scope: "admin" },
            ].map((k) => (
              <li key={k.key} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-ink">{k.name}</p>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">{k.key} · {k.scope}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Creada {k.created}</p>
                  <button className="mt-0.5 text-xs font-semibold text-red-500 hover:underline">Revocar</button>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
