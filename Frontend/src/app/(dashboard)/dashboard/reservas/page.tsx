"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, Search, CheckCircle2, XCircle, AlertCircle, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ReservationStatus } from "@/lib/types";
import { getAuthUser } from "@/lib/auth";
import { fetchReservationsByTenant, type ReservationApiData } from "@/lib/api";

const STATUS_FILTER_OPTIONS: Array<{ value: ReservationStatus | "all"; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "pending", label: "Pendientes" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

const SERVICE_LABELS: Record<string, string> = {
  table: "Mesa",
  rafting: "Rafting",
  room: "Habitación",
  experience: "Experiencia",
};

function initials(name: string): string {
  return name.split(" ").map(s => s[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

function formatTime(time: string | null): string {
  if (!time) return "—";
  // time may come as "13:00:00" or "13:00"
  return time.slice(0, 5);
}

export default function ReservasPage() {
  const [reservations, setReservations] = useState<ReservationApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReservationApiData | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">("all");

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) {
      setLoading(false);
      return;
    }
    fetchReservationsByTenant(user.tenantSlug).then(data => {
      setReservations(data);
      setLoading(false);
    });
  }, []);

  const filtered = reservations.filter(r =>
    (statusFilter === "all" || r.status === statusFilter) &&
    (r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (r.serviceType || "").toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: reservations.length,
    confirmed: reservations.filter(r => r.status === "confirmed").length,
    pending: reservations.filter(r => r.status === "pending").length,
    revenue: reservations.filter(r => r.status !== "cancelled").reduce((s, r) => s + (r.total || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Reservas</h1><p className="text-sm text-slate-400">Gestión de reservas del restaurante</p></div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total reservas", value: stats.total, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Confirmadas", value: stats.confirmed, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Pendientes", value: stats.pending, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Ingresos estimados", value: `S/${stats.revenue}`, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft flex items-center gap-4">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`}/>
              </div>
              <div><p className="text-xs text-slate-400">{s.label}</p><p className="text-xl font-bold text-ink">{s.value}</p></div>
            </motion.div>
          ))}
        </div>

        {/* Filters + table */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar reserva..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20 shadow-soft"/>
          </div>
          <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-soft">
            {STATUS_FILTER_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setStatusFilter(o.value)}
                className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${statusFilter === o.value ? "bg-[#0c4a6e] text-white" : "text-slate-500"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-6">
          {/* List */}
          <motion.div layout className="flex-1 rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
            <div className="divide-y divide-slate-50">
              {loading ? (
                <div className="py-12 text-center text-sm text-slate-400">Cargando reservas…</div>
              ) : filtered.map((r) => (
                <button key={r.id} onClick={() => setSelected(r)} className={`w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors text-left ${selected?.id === r.id ? "bg-blue-50" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{initials(r.customerName)}</div>
                    <div>
                      <p className="font-medium text-ink text-sm">{r.customerName}</p>
                      <p className="text-xs text-slate-400">{SERVICE_LABELS[r.serviceType] ?? r.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-slate-400">{formatDate(r.reservationDate)} · {formatTime(r.reservationTime)}</p>
                      <p className="text-xs text-slate-400">{r.guests} personas · S/{r.total}</p>
                    </div>
                    <StatusBadge status={r.status as ReservationStatus} type="reservation"/>
                    <ChevronRight className="h-4 w-4 text-slate-300"/>
                  </div>
                </button>
              ))}
              {!loading && filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No hay reservas para este filtro</div>}
            </div>
          </motion.div>

          {/* Detail panel */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="w-72 flex-shrink-0 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft h-fit sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold text-ink">Detalle</h3>
                  <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                    <XCircle className="h-4 w-4"/>
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] flex items-center justify-center text-sm font-bold text-white">{initials(selected.customerName)}</div>
                  <div><p className="font-semibold text-ink">{selected.customerName}</p><p className="text-xs text-slate-400">{selected.customerPhone ?? "—"}</p></div>
                </div>
                <dl className="space-y-3 text-sm">
                  {[
                    { label: "Servicio", value: SERVICE_LABELS[selected.serviceType] ?? selected.serviceType },
                    { label: "Fecha", value: `${formatDate(selected.reservationDate)} · ${formatTime(selected.reservationTime)}` },
                    { label: "Personas", value: `${selected.guests}` },
                    { label: "Monto", value: `S/${selected.total}` },
                    { label: "Estado", value: <StatusBadge status={selected.status as ReservationStatus} type="reservation"/> },
                    ...(selected.notes ? [{ label: "Notas", value: selected.notes }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-start justify-between gap-2">
                      <dt className="text-slate-400">{label}</dt>
                      <dd className="font-medium text-ink text-right">{value}</dd>
                    </div>
                  ))}
                </dl>
                {selected.status === "pending" && (
                  <div className="mt-6 flex gap-2">
                    <button className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-semibold text-white">Confirmar</button>
                    <button className="flex-1 rounded-xl border border-red-200 py-2.5 text-sm font-semibold text-red-500">Rechazar</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
