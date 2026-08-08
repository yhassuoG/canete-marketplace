"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, TrendingUp, TrendingDown, Download } from "lucide-react";
import {
  fetchAllOrders,
  fetchTenants,
  OrderApiResponse,
  TenantApiData,
} from "@/lib/api";

type PayStatus = "completed" | "pending" | "refunded" | "failed";

interface PaymentRow {
  id: string;
  tenant: string;
  customer: string;
  amount: number;
  fee: number;
  net: number;
  status: PayStatus;
  date: string;
  method: string;
}

const STATUS_STYLE: Record<PayStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  refunded: "bg-blue-50 text-blue-700",
  failed: "bg-red-50 text-red-600",
};
const STATUS_LABEL: Record<PayStatus, string> = {
  completed: "Completado",
  pending: "Pendiente",
  refunded: "Reembolsado",
  failed: "Fallido",
};

/** Mapea el estado del pedido a un estado de pago. */
function mapStatus(orderStatus: string): PayStatus {
  switch (orderStatus) {
    case "delivered":
    case "completed":
      return "completed";
    case "cancelled":
      return "failed";
    case "refunded":
      return "refunded";
    default:
      return "pending";
  }
}

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PayStatus | "all">("all");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [orders, tenants] = await Promise.all([
        fetchAllOrders(),
        fetchTenants(),
      ]);
      const tenantMap = new Map<string, string>();
      tenants.forEach((t: TenantApiData) => tenantMap.set(t.id, t.name));
      const rows: PaymentRow[] = orders.map((o: OrderApiResponse) => {
        const fee = +(o.total * 0.03).toFixed(2);
        return {
          id: o.id.slice(0, 8).toUpperCase(),
          tenant: tenantMap.get(o.tenantId) ?? "—",
          customer: o.customerName,
          amount: o.total,
          fee,
          net: +(o.total - fee).toFixed(2),
          status: mapStatus(o.status),
          date: new Date(o.createdAt).toLocaleString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          method: o.paymentMethod ?? "—",
        };
      });
      setPayments(rows);
      setLoading(false);
    })();
  }, []);

  const filtered = payments.filter(
    (p) =>
      (filter === "all" || p.status === filter) &&
      (p.tenant.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.customer.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollected = payments
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.amount, 0);
  const totalFees = payments
    .filter((p) => p.status === "completed")
    .reduce((s, p) => s + p.fee, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink">Pagos</h1><p className="text-sm text-slate-400 mt-1">Historial de transacciones de la plataforma</p></div>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft">
          <Download className="h-4 w-4"/> Exportar CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Recaudado (May)", value: `S/${totalCollected.toLocaleString()}`, sub: `${payments.length} transacciones`, up: true },
          { label: "Comisiones generadas", value: `S/${totalFees.toFixed(0)}`, sub: "3% promedio", up: true },
          { label: "Transacciones hoy", value: payments.length.toString(), sub: `${payments.filter(p => p.status === "failed").length} fallidas`, up: false },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{s.value}</p>
            <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${s.up ? "text-emerald-600" : "text-slate-400"}`}>
              {s.up ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}{s.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar transacción..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20 shadow-soft"/>
        </div>
        <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-soft">
          {(["all", "completed", "pending", "refunded", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "bg-[#083d77] text-white shadow" : "text-slate-500"}`}>
              {f === "all" ? "Todos" : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-50">
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">ID</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Empresa · Cliente</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Método</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Monto</th>
            <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Comisión</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Estado</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Fecha</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Cargando transacciones…</td></tr>
            ) : filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.id}</td>
                <td className="px-6 py-4"><p className="font-medium text-ink">{p.tenant}</p><p className="text-xs text-slate-400">{p.customer}</p></td>
                <td className="px-6 py-4 text-slate-500 text-xs">{p.method}</td>
                <td className="px-6 py-4 text-right font-bold text-ink">S/{p.amount}</td>
                <td className="px-6 py-4 text-right text-xs text-slate-400">S/{p.fee}</td>
                <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span></td>
                <td className="px-6 py-4 text-xs text-slate-400">{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="py-12 text-center text-sm text-slate-400">No se encontraron transacciones</div>}
      </motion.div>
    </div>
  );
}
