"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, XCircle, Filter } from "lucide-react";

type Severity = "info" | "warning" | "error";

const LOGS = [
  { id: "L001", action: "PLAN_UPGRADED", actor: "admin@canete.app", target: "Hotel Luna (t4)", timestamp: "22 May 2026, 20:31", severity: "info" as Severity },
  { id: "L002", action: "USER_LOGIN_FAILED", actor: "unknown@evil.com", target: "Auth", timestamp: "22 May 2026, 20:18", severity: "warning" as Severity },
  { id: "L003", action: "TENANT_SUSPENDED", actor: "carlos@canete.app", target: "Negocio XYZ (t99)", timestamp: "22 May 2026, 19:55", severity: "warning" as Severity },
  { id: "L004", action: "PAYMENT_REFUNDED", actor: "maria@canete.app", target: "TXN-8817 · S/520", timestamp: "22 May 2026, 18:44", severity: "info" as Severity },
  { id: "L005", action: "API_RATE_LIMIT_EXCEEDED", actor: "t4-api-key", target: "/api/catalog", timestamp: "22 May 2026, 17:12", severity: "error" as Severity },
  { id: "L006", action: "USER_CREATED", actor: "carlos@canete.app", target: "sofia@canete.app", timestamp: "22 May 2026, 15:40", severity: "info" as Severity },
  { id: "L007", action: "SETTINGS_CHANGED", actor: "carlos@canete.app", target: "Platform config", timestamp: "22 May 2026, 14:22", severity: "info" as Severity },
  { id: "L008", action: "DB_BACKUP_FAILED", actor: "system", target: "PostgreSQL", timestamp: "22 May 2026, 03:00", severity: "error" as Severity },
  { id: "L009", action: "COUPON_BULK_CREATED", actor: "maria@canete.app", target: "100 coupons · Muelle Pacifico", timestamp: "21 May 2026, 22:10", severity: "info" as Severity },
  { id: "L010", action: "PLAN_DOWNGRADED", actor: "admin@canete.app", target: "Bodega Sol (t12)", timestamp: "21 May 2026, 20:05", severity: "warning" as Severity },
];

const SEV_CONFIG: Record<Severity, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  info:    { icon: Info,          bg: "bg-blue-50",   text: "text-blue-600",   label: "Info" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-600",  label: "Advertencia" },
  error:   { icon: XCircle,       bg: "bg-red-50",    text: "text-red-600",    label: "Error" },
};

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<Severity | "all">("all");

  const filtered = LOGS.filter(l => filter === "all" || l.severity === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Auditoría</h1>
        <p className="text-sm text-slate-400 mt-1">Registro completo de eventos del sistema</p>
      </div>

      {/* Counts */}
      <div className="flex flex-wrap gap-3">
        {(["all", "info", "warning", "error"] as const).map((s) => {
          const count = s === "all" ? LOGS.length : LOGS.filter(l => l.severity === s).length;
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${filter === s ? "border-[#083d77] bg-[#083d77] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {s !== "all" && (() => { const { icon: Icon, text } = SEV_CONFIG[s]; return <Icon className={`h-3.5 w-3.5 ${filter === s ? "text-white" : text}`}/>; })()}
              {s === "all" ? "Todos" : SEV_CONFIG[s].label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${filter === s ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Severidad</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Acción</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Actor</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Objetivo</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Timestamp</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((log) => {
              const { icon: Icon, bg, text, label } = SEV_CONFIG[log.severity];
              return (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bg} ${text}`}>
                      <Icon className="h-3 w-3"/>{label}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-medium text-ink">{log.action}</td>
                  <td className="px-6 py-4 text-slate-500">{log.actor}</td>
                  <td className="px-6 py-4 text-slate-500">{log.target}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{log.timestamp}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-400">Sin eventos para este filtro</div>}
      </motion.div>
    </div>
  );
}
