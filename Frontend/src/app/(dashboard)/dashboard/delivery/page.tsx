"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Truck, Clock, CheckCircle2, Package, ChefHat, MapPin, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrderStatus } from "@/lib/types";
import { fetchOrdersByTenant, fetchTenant, updateOrderStatus, type OrderApiResponse } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

const STATUS_FLOW_DELIVERY: { status: OrderStatus; icon: typeof Package; label: string }[] = [
  { status: "pending", icon: Package, label: "Recibido" },
  { status: "confirmed", icon: CheckCircle2, label: "Confirmado" },
  { status: "preparing", icon: ChefHat, label: "Preparando" },
  { status: "on_the_way", icon: Truck, label: "En camino" },
  { status: "delivered", icon: CheckCircle2, label: "Entregado" },
];

const STATUS_FLOW_PICKUP: { status: OrderStatus; icon: typeof Package; label: string }[] = [
  { status: "pending", icon: Package, label: "Recibido" },
  { status: "confirmed", icon: CheckCircle2, label: "Confirmado" },
  { status: "preparing", icon: ChefHat, label: "Preparando" },
  { status: "ready_for_pickup", icon: CheckCircle2, label: "Listo para recoger" },
  { status: "delivered", icon: CheckCircle2, label: "Entregado" },
];

function OrderCard({ order, onAdvance }: { order: OrderApiResponse; onAdvance: (id: string, next: OrderStatus) => void }) {
  const flow = order.deliveryType === "pickup" ? STATUS_FLOW_PICKUP : STATUS_FLOW_DELIVERY;
  const stepIdx = flow.findIndex(s => s.status === order.status);
  const nextStatus = stepIdx >= 0 && stepIdx < flow.length - 1 ? flow[stepIdx + 1].status : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-ink">{order.customerName}</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
            <MapPin className="h-3 w-3"/>{order.customerAddress || "Recojo en local"}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} type="order"/>
          <p className="text-xs text-slate-400 mt-1">{new Date(order.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
      </div>

      <ul className="mb-4 space-y-1">
        {order.items.map(item => (
          <li key={item.id} className="text-sm text-slate-600">· {item.productName} x{item.quantity}</li>
        ))}
      </ul>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 mb-4">
        {flow.map((step, i) => {
          const done = i <= stepIdx;
          const StepIcon = step.icon;
          return (
            <div key={step.status} className="flex flex-1 items-center">
              <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs transition-colors ${done ? "bg-[#0c4a6e] text-white" : "bg-slate-100 text-slate-400"}`}>
                <StepIcon className="h-3.5 w-3.5"/>
              </div>
              {i < flow.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < stepIdx ? "bg-[#0c4a6e]" : "bg-slate-100"}`}/>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-ink">S/{order.total}</span>
        {order.deliveryType === "delivery" && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Truck className="h-3.5 w-3.5 text-[#0c4a6e]"/>Delivery
          </span>
        )}
        {order.deliveryType === "pickup" && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <Package className="h-3.5 w-3.5 text-[#0c4a6e]"/>Recojo
          </span>
        )}
      </div>

      {/* Advance button — triggers WhatsApp notification on backend */}
      {nextStatus && (
        <button
          onClick={() => onAdvance(order.id, nextStatus)}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0c4a6e] py-2.5 text-sm font-semibold text-white transition hover:bg-[#083d77] active:scale-[0.98]"
        >
          Marcar como &quot;{flow.find(s => s.status === nextStatus)?.label}&quot;
          <ArrowRight className="h-4 w-4"/>
        </button>
      )}
    </motion.div>
  );
}

export default function DeliveryPage() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<OrderApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (tenantId: string) => {
    const data = await fetchOrdersByTenant(tenantId);
    setOrders(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const user = getAuthUser();
    if (!user || !user.tenantSlug) {
      setError("No tienes una tienda asignada. Inicia sesión como dueño de negocio.");
      setLoading(false);
      return;
    }
    fetchTenant(user.tenantSlug).then((tenant) => {
      if (!tenant) {
        setError(`No se encontró la tienda "${user.tenantName ?? user.tenantSlug}".`);
        setLoading(false);
        return;
      }
      load(tenant.id);
    });
  }, [load]);

  const handleAdvance = async (id: string, next: OrderStatus) => {
    const updated = await updateOrderStatus(id, next);
    if (updated) {
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const active = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Delivery</h1><p className="text-sm text-slate-400">{active.length} pedidos activos en este momento</p></div>
      </header>

      <div className="p-6 space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Activos", value: active.length, color: "text-[#0c4a6e] bg-blue-50", icon: Truck },
            { label: "Preparando", value: orders.filter(o => o.status === "preparing").length, color: "text-amber-600 bg-amber-50", icon: ChefHat },
            { label: "En camino", value: orders.filter(o => o.status === "on_the_way").length, color: "text-violet-600 bg-violet-50", icon: Truck },
            { label: "Entregados hoy", value: orders.filter(o => o.status === "delivered").length, color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-3xl border border-slate-100 bg-white p-4 shadow-soft flex items-center gap-3">
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${s.color.split(" ")[1]}`}>
                <s.icon className={`h-4 w-4 ${s.color.split(" ")[0]}`}/>
              </div>
              <div><p className="text-xs text-slate-400">{s.label}</p><p className="text-xl font-bold text-ink">{s.value}</p></div>
            </motion.div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-soft w-fit">
          {([
            { v: "all" as const, l: "Todos" }, { v: "pending" as OrderStatus, l: "Recibidos" },
            { v: "preparing" as OrderStatus, l: "Preparando" }, { v: "on_the_way" as OrderStatus, l: "En camino" },
            { v: "delivered" as OrderStatus, l: "Entregados" },
          ]).map(o => (
            <button key={o.v} onClick={() => setFilter(o.v)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-all ${filter === o.v ? "bg-[#0c4a6e] text-white" : "text-slate-500"}`}>
              {o.l}
            </button>
          ))}
        </div>

        {/* Grid */}
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : loading ? (
          <p className="text-sm text-slate-400">Cargando pedidos…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No hay pedidos para mostrar.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(order => <OrderCard key={order.id} order={order} onAdvance={handleAdvance}/>)}
          </div>
        )}
      </div>
    </div>
  );
}
