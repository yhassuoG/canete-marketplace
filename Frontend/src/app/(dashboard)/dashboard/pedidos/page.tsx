"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  XCircle,
  ChevronDown,
  Store,
  Bike,
  CreditCard,
  Banknote,
  Phone,
  MapPin,
  StickyNote,
  AlertCircle,
} from "lucide-react";
import {
  fetchOrdersByTenant,
  fetchTenant,
  updateOrderStatus,
  type OrderApiResponse,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

// ── Status definitions ──────────────────────────────────────────────────────
const STATUS_FLOW: Record<string, { label: string; color: string; icon: typeof Clock; next?: string }> = {
  pending:          { label: "Pendiente",   color: "bg-amber-50 text-amber-700 border-amber-200",       icon: Clock,        next: "confirmed" },
  confirmed:        { label: "Confirmado",  color: "bg-blue-50 text-blue-700 border-blue-200",         icon: CheckCircle2, next: "preparing" },
  preparing:        { label: "Preparando",  color: "bg-purple-50 text-purple-700 border-purple-200",   icon: ChefHat,      next: "on_the_way" },
  on_the_way:       { label: "En camino",   color: "bg-indigo-50 text-indigo-700 border-indigo-200",   icon: Truck,        next: "delivered" },
  ready_for_pickup: { label: "Listo p/ recoger", color: "bg-teal-50 text-teal-700 border-teal-200",     icon: CheckCircle2, next: "delivered" },
  delivered:        { label: "Entregado",   color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled:        { label: "Cancelado",   color: "bg-red-50 text-red-600 border-red-200",            icon: XCircle },
};

const STATUS_ORDER = ["pending", "confirmed", "preparing", "on_the_way", "ready_for_pickup", "delivered", "cancelled"];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  efectivo: "Efectivo",
  card: "Tarjeta",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transfer: "Transferencia",
};

function formatCurrency(n: number) {
  return `S/${n.toFixed(2)}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortOrderId(id: string) {
  return id.substring(0, 8).toUpperCase();
}

export default function DashboardPedidosPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [tenantName, setTenantName] = useState<string>("");
  const [orders, setOrders] = useState<OrderApiResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Resolve tenant from logged-in user
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
      setTenantId(tenant.id);
      setTenantName(tenant.name);
    });
  }, []);

  // Load orders when tenantId is resolved
  const loadOrders = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const data = await fetchOrdersByTenant(tenantId);
    setOrders(data);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Advance order status
  async function advanceStatus(orderId: string, currentStatus: string, deliveryType?: string) {
    let next = STATUS_FLOW[currentStatus]?.next;
    if (!next) return;
    // Pickup orders go preparing → ready_for_pickup (not on_the_way)
    if (currentStatus === "preparing" && deliveryType === "pickup") {
      next = "ready_for_pickup";
    }
    setUpdatingId(orderId);
    const updated = await updateOrderStatus(orderId, next);
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
    setUpdatingId(null);
  }

  // Cancel order
  async function cancelOrder(orderId: string) {
    setUpdatingId(orderId);
    const updated = await updateOrderStatus(orderId, "cancelled");
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    }
    setUpdatingId(null);
  }

  // Filtered orders
  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      shortOrderId(o.id).toLowerCase().includes(search.toLowerCase()) ||
      (o.customerPhone ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    active: orders.filter((o) => ["confirmed", "preparing", "on_the_way"].includes(o.status)).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders.filter((o) => o.status === "delivered").reduce((s, o) => s + Number(o.total), 0),
  };

  // Error state (no tenant assigned)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex items-center justify-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-soft text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-ink mb-1">No se pueden cargar los pedidos</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Pedidos</h1>
          <p className="text-sm text-slate-400 mt-1">
            {tenantName ? `Gestiona los pedidos de ${tenantName}` : "Gestiona y avanza el estado de los pedidos"}
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "En proceso", value: stats.active, icon: ChefHat, color: "text-purple-600" },
          { label: "Entregados", value: stats.delivered, icon: CheckCircle2, color: "text-emerald-600" },
          { label: "Ingresos", value: formatCurrency(stats.revenue), icon: CreditCard, color: "text-[#083d77]" },
        ].map((s) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{s.label}</p>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="mt-1 text-2xl font-bold text-ink">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, orden o teléfono..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20 shadow-soft"
          />
        </div>
        <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-soft overflow-x-auto">
          {(["all", ...STATUS_ORDER] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === f ? "bg-[#083d77] text-white shadow" : "text-slate-500"
              }`}
            >
              {f === "all" ? "Todos" : STATUS_FLOW[f]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-3 text-sm text-slate-400">Cargando pedidos...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-slate-100 bg-white shadow-soft py-20 text-center">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {orders.length === 0
              ? "Aún no hay pedidos para tu tienda"
              : "No se encontraron pedidos con los filtros aplicados"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, idx) => {
            const statusInfo = STATUS_FLOW[order.status] ?? STATUS_FLOW.pending;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedId === order.id;
            const canAdvance = !!statusInfo.next;
            const canCancel = order.status !== "delivered" && order.status !== "cancelled";
            const isUpdating = updatingId === order.id;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden"
              >
                {/* Order header row */}
                <div
                  className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                >
                  {/* Order ID + status icon */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${statusInfo.color}`}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-ink">#{shortOrderId(order.id)}</p>
                      <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{order.customerName}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"} · {formatCurrency(Number(order.total))}
                    </p>
                  </div>

                  {/* Delivery type badge */}
                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                    {order.deliveryType === "pickup" ? (
                      <><Store className="h-3.5 w-3.5" /> Recojo</>
                    ) : (
                      <><Bike className="h-3.5 w-3.5" /> Delivery</>
                    )}
                  </div>

                  {/* Status badge */}
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>

                  {/* Expand chevron */}
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  />
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 px-6 py-5 bg-slate-50/50 space-y-4">
                        {/* Customer details + items */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Left: customer info */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Cliente</p>
                            <div className="space-y-1.5 text-sm">
                              <p className="flex items-center gap-2 text-ink">
                                <span className="font-medium">{order.customerName}</span>
                              </p>
                              {order.customerPhone && (
                                <p className="flex items-center gap-2 text-slate-500">
                                  <Phone className="h-3.5 w-3.5" /> {order.customerPhone}
                                </p>
                              )}
                              {order.customerAddress && (
                                <p className="flex items-center gap-2 text-slate-500">
                                  <MapPin className="h-3.5 w-3.5" /> {order.customerAddress}
                                </p>
                              )}
                              {order.paymentMethod && (
                                <p className="flex items-center gap-2 text-slate-500">
                                  <Banknote className="h-3.5 w-3.5" /> {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                                </p>
                              )}
                              {order.notes && (
                                <p className="flex items-start gap-2 text-slate-500">
                                  <StickyNote className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" /> {order.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Right: items */}
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Productos</p>
                            <div className="space-y-1.5">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <span className="text-ink">
                                    <span className="font-medium">{item.quantity}x</span> {item.productName}
                                  </span>
                                  <span className="text-slate-500">{formatCurrency(Number(item.subtotal))}</span>
                                </div>
                              ))}
                              <div className="border-t border-slate-200 pt-1.5 mt-1.5 space-y-1">
                                <div className="flex justify-between text-xs text-slate-400">
                                  <span>Subtotal</span>
                                  <span>{formatCurrency(Number(order.subtotal))}</span>
                                </div>
                                {Number(order.deliveryFee) > 0 && (
                                  <div className="flex justify-between text-xs text-slate-400">
                                    <span>Envío</span>
                                    <span>{formatCurrency(Number(order.deliveryFee))}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-ink">
                                  <span>Total</span>
                                  <span>{formatCurrency(Number(order.total))}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                          {canAdvance && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                advanceStatus(order.id, order.status, order.deliveryType);
                              }}
                              disabled={isUpdating}
                              className="flex items-center gap-2 rounded-xl bg-[#083d77] px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-[#062d56] transition-colors disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <ArrowRight className="h-4 w-4" />
                              )}
                              Avanzar a {STATUS_FLOW[order.status === "preparing" && order.deliveryType === "pickup" ? "ready_for_pickup" : statusInfo.next!]?.label}
                            </button>
                          )}
                          {canCancel && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelOrder(order.id);
                              }}
                              disabled={isUpdating}
                              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar pedido
                            </button>
                          )}
                          {!canAdvance && order.status === "delivered" && (
                            <span className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                              <CheckCircle2 className="h-4 w-4" /> Pedido completado
                            </span>
                          )}
                          {!canAdvance && order.status === "cancelled" && (
                            <span className="flex items-center gap-2 text-sm text-red-500 font-medium">
                              <XCircle className="h-4 w-4" /> Pedido cancelado
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Inline icon to avoid import issues
function ArrowRight(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
