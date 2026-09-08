"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, XCircle, RefreshCw, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { fetchAuditLogs, fetchAuditSummary, type AuditLogEntry, type AuditLogSummary } from "@/lib/api";

type Severity = "info" | "warning" | "error";

const SEV_CONFIG: Record<Severity, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  info:    { icon: Info,          bg: "bg-blue-50",   text: "text-blue-600",   label: "Info" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50",  text: "text-amber-600",  label: "Advertencia" },
  error:   { icon: XCircle,       bg: "bg-red-50",    text: "text-red-600",    label: "Error" },
};

function formatTime(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-PE", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    });
  } catch {
    return iso;
  }
}

export default function AdminLogsPage() {
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [summary, setSummary] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [logs, sum] = await Promise.all([
        fetchAuditLogs({
          page,
          size: 50,
          severity: filter === "all" ? undefined : filter,
          action: search || undefined,
        }),
        fetchAuditSummary(),
      ]);
      if (logs) {
        setEntries(logs.entries);
        setTotalPages(logs.totalPages);
        setTotalElements(logs.totalElements);
      } else {
        setError(true);
      }
      if (sum) setSummary(sum);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const counts = {
    all: summary?.total ?? 0,
    info: summary?.info ?? 0,
    warning: summary?.warning ?? 0,
    error: summary?.error ?? 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Auditoría</h1>
          <p className="text-sm text-slate-400 mt-1">Registro completo de eventos del sistema</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Counts / filters */}
      <div className="flex flex-wrap gap-3">
        {(["all", "info", "warning", "error"] as const).map((s) => {
          const count = counts[s];
          return (
            <button key={s} onClick={() => { setFilter(s); setPage(0); }}
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all ${filter === s ? "border-[#083d77] bg-[#083d77] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
              {s !== "all" && (() => { const { icon: Icon, text } = SEV_CONFIG[s]; return <Icon className={`h-3.5 w-3.5 ${filter === s ? "text-white" : text}`}/>; })()}
              {s === "all" ? "Todos" : SEV_CONFIG[s].label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${filter === s ? "bg-white/20" : "bg-slate-100"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Buscar por acción (ej: LOGIN, ORDER, PAYMENT)..."
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#083d77] focus:outline-none"
        />
        <button onClick={handleSearch}
          className="flex items-center gap-2 rounded-xl bg-[#083d77] px-4 py-2 text-sm font-medium text-white hover:bg-[#062d5a]">
          <Search className="h-4 w-4" />
          Buscar
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          No se pudo conectar con el backend. Verifica que el servidor esté funcionando.
        </div>
      )}

      {/* Loading state */}
      {loading && entries.length === 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center text-slate-400">
          Cargando logs...
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && entries.length === 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-12 text-center">
          <Info className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-slate-400">No hay eventos de auditoría registrados.</p>
          <p className="text-xs text-slate-400 mt-1">Los eventos aparecerán aquí cuando haya actividad en el sistema.</p>
        </div>
      )}

      {/* Table */}
      {entries.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-50">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Severidad</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Acción</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Actor</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Objetivo</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Detalle</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">IP</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Fecha</th>
            </tr></thead>
            <tbody>
              {entries.map((log) => {
                const sev = (log.severity as Severity) || "info";
                const { icon: Icon, bg, text } = SEV_CONFIG[sev];
                return (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
                        <Icon className="h-3 w-3" />
                        {SEV_CONFIG[sev].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">{log.action}</td>
                    <td className="px-6 py-4 text-slate-600">{log.actor}</td>
                    <td className="px-6 py-4 text-slate-600">{log.target || "—"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate" title={log.details}>{log.details || "—"}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{log.ipAddress || "—"}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{formatTime(log.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            {totalElements} eventos · Página {page + 1} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 hover:border-slate-300">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
              className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40 hover:border-slate-300">
              Siguiente <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
