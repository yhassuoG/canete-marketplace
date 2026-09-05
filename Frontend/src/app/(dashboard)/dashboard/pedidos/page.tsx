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
  Eye,
  Loader2,
  Smartphone,
  Printer,
} from "lucide-react";
import {
  fetchOrdersByTenant,
  fetchTenant,
  updateOrderStatus,
  fetchPaymentProofs,
  confirmPaymentProof,
  rejectPaymentProof,
  type OrderApiResponse,
  type PaymentProofApiData,
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
  payment_rejected: { label: "Pago rechazado", color: "bg-red-50 text-red-600 border-red-200",          icon: XCircle },
};

const STATUS_ORDER = ["pending", "confirmed", "preparing", "on_the_way", "ready_for_pickup", "delivered", "cancelled", "payment_rejected"];

// Progress stepper flows (shared with delivery page)
const STEPPER_DELIVERY: { status: string; icon: typeof Clock; label: string }[] = [
  { status: "pending", icon: Package, label: "Recibido" },
  { status: "confirmed", icon: CheckCircle2, label: "Confirmado" },
  { status: "preparing", icon: ChefHat, label: "Preparando" },
  { status: "on_the_way", icon: Truck, label: "En camino" },
  { status: "delivered", icon: CheckCircle2, label: "Entregado" },
];
const STEPPER_PICKUP: { status: string; icon: typeof Clock; label: string }[] = [
  { status: "pending", icon: Package, label: "Recibido" },
  { status: "confirmed", icon: CheckCircle2, label: "Confirmado" },
  { status: "preparing", icon: ChefHat, label: "Preparando" },
  { status: "ready_for_pickup", icon: CheckCircle2, label: "Listo p/ recoger" },
  { status: "delivered", icon: CheckCircle2, label: "Entregado" },
];

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

// ── WhatsApp notification via wa.me link (100% free, no API needed) ──────────
function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  // Perú: 9-digit number starting with 9 → add country code 51
  if (digits.length === 9 && digits.startsWith("9")) digits = "51" + digits;
  return digits;
}

function buildWhatsAppMessage(order: OrderApiResponse, newStatus: string, tenantName: string): string | null {
  const id = shortOrderId(order.id);
  const total = Number(order.total).toFixed(2);
  switch (newStatus) {
    case "confirmed":
      return `✅ Tu pedido #${id} a ${tenantName} ha sido CONFIRMADO y está siendo preparado.\n\nTotal: S/${total}\n\n¡Gracias por tu compra!`;
    case "cancelled":
      return `❌ Lamentablemente tu pedido #${id} a ${tenantName} ha sido CANCELADO. Si tienes dudas, contáctanos.`;
    case "on_the_way":
      return `🚀 Tu pedido #${id} va en camino. ¡Prepárate para recibirlo!`;
    case "ready_for_pickup":
      return `✅ Tu pedido #${id} está listo para recoger. Te esperamos en ${tenantName}!`;
    default:
      return null;
  }
}

function openWhatsAppNotification(order: OrderApiResponse, newStatus: string, tenantName: string) {
  if (!order.customerPhone) return;
  const phone = normalizePhone(order.customerPhone);
  if (!phone) return;
  const msg = buildWhatsAppMessage(order, newStatus, tenantName);
  if (!msg) return;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// ── Print ticket with QR for delivery orders ────────────────────────────────
function printTicket(order: OrderApiResponse, tenantName: string) {
  const mapsUrl = order.deliveryLat && order.deliveryLng
    ? `https://www.google.com/maps?q=${order.deliveryLat},${order.deliveryLng}`
    : null;
  // QR code image from api.qrserver.com (free, no key needed)
  const qrUrl = mapsUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(mapsUrl)}`
    : null;

  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding:4px 0;">${item.quantity}x</td>
      <td style="padding:4px 0;">${item.productName}</td>
      <td style="padding:4px 0;text-align:right;">S/${Number(item.subtotal).toFixed(2)}</td>
    </tr>
  `).join("");

  const deliveryInfo = order.deliveryType === "delivery"
    ? `<p><strong>Dirección:</strong> ${order.customerAddress ?? "—"}</p>`
    : `<p><strong>Tipo:</strong> Recojo en local</p>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>Ticket #${shortOrderId(order.id)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; width: 80mm; margin: 0 auto; padding: 8mm; color: #000; }
  h1 { font-size: 18px; text-align: center; margin-bottom: 4px; }
  h2 { font-size: 14px; text-align: center; margin-bottom: 8px; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  p { font-size: 12px; line-height: 1.6; }
  table { width: 100%; font-size: 12px; border-collapse: collapse; }
  td { vertical-align: top; }
  .total { font-size: 14px; font-weight: bold; }
  .qr { text-align: center; margin: 8px 0; }
  .qr img { width: 180px; height: 180px; }
  .footer { text-align: center; font-size: 10px; margin-top: 8px; }
  .badge { display: inline-block; border: 1px solid #000; padding: 2px 8px; font-size: 10px; border-radius: 4px; }
</style>
</head>
<body>
  <h1>${tenantName}</h1>
  <h2>Ticket de Pedido</h2>
  <hr>
  <p><strong>Pedido:</strong> #${shortOrderId(order.id)}</p>
  <p><strong>Fecha:</strong> ${formatDate(order.createdAt)}</p>
  <p><strong>Cliente:</strong> ${order.customerName}</p>
  ${order.customerPhone ? `<p><strong>Tel:</strong> ${order.customerPhone}</p>` : ""}
  <p><strong>Pago:</strong> ${PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—"}</p>
  <hr>
  ${deliveryInfo}
  <hr>
  <table>
    <thead>
      <tr style="border-bottom: 1px solid #000;">
        <th style="padding:4px 0;text-align:left;">Cant</th>
        <th style="padding:4px 0;text-align:left;">Producto</th>
        <th style="padding:4px 0;text-align:right;">Precio</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  <hr>
  <table>
    <tr><td>Subtotal:</td><td style="text-align:right;">S/${Number(order.subtotal).toFixed(2)}</td></tr>
    ${Number(order.deliveryFee) > 0 ? `<tr><td>Envío:</td><td style="text-align:right;">S/${Number(order.deliveryFee).toFixed(2)}</td></tr>` : ""}
    <tr class="total"><td>TOTAL:</td><td style="text-align:right;">S/${Number(order.total).toFixed(2)}</td></tr>
  </table>
  ${order.notes ? `<hr><p><strong>Notas:</strong> ${order.notes}</p>` : ""}
  ${qrUrl ? `<hr><div class="qr"><img src="${qrUrl}" alt="QR Maps"/><br><span class="badge">Escanear para ver ubicación</span></div>` : ""}
  <hr>
  <div class="footer">
    <p>¡Gracias por su compra!</p>
    <p>vallecanete.com</p>
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const w = window.open("", "_blank", "width=400,height=600");
  if (w) {
    w.document.write(html);
    w.document.close();
  }
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
  // Payment proof state
  const [proofsByOrder, setProofsByOrder] = useState<Record<string, PaymentProofApiData[]>>({});
  const [viewProof, setViewProof] = useState<PaymentProofApiData | null>(null);
  const [rejectingProof, setRejectingProof] = useState<{ proofId: string; orderId: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actingProof, setActingProof] = useState<string | null>(null);

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
      // Auto-open WhatsApp with pre-filled message (free, no API)
      openWhatsAppNotification(updated, next, tenantName);
    }
    setUpdatingId(null);
  }

  // Cancel order
  async function cancelOrder(orderId: string) {
    setUpdatingId(orderId);
    const updated = await updateOrderStatus(orderId, "cancelled");
    if (updated) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      // Auto-open WhatsApp with cancellation message
      openWhatsAppNotification(updated, "cancelled", tenantName);
    }
    setUpdatingId(null);
  }

  // Load payment proofs for an order (when expanding)
  async function loadProofsForOrder(orderId: string) {
    if (proofsByOrder[orderId]) return;
    const proofs = await fetchPaymentProofs(orderId);
    setProofsByOrder((prev) => ({ ...prev, [orderId]: proofs }));
  }

  // Approve payment proof inline
  async function handleConfirmProof(proofId: string, orderId: string) {
    const user = getAuthUser();
    setActingProof(proofId);
    const res = await confirmPaymentProof(proofId, user?.name);
    if (res) {
      setProofsByOrder((prev) => ({
        ...prev,
        [orderId]: (prev[orderId] ?? []).map((p) => (p.id === proofId ? res : p)),
      }));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "APPROVED" } : o)));
      setViewProof(null);
    }
    setActingProof(null);
  }

  // Reject payment proof inline
  async function handleRejectProof(proofId: string, orderId: string) {
    if (!rejectReason.trim()) return;
    const user = getAuthUser();
    setActingProof(proofId);
    const res = await rejectPaymentProof(proofId, rejectReason, user?.name);
    if (res) {
      setProofsByOrder((prev) => ({
        ...prev,
        [orderId]: (prev[orderId] ?? []).map((p) => (p.id === proofId ? res : p)),
      }));
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "REJECTED", status: "payment_rejected" } : o)));
      setRejectingProof(null);
      setRejectReason("");
      setViewProof(null);
    }
    setActingProof(null);
  }

  // Payment badge info for an order
  function getPaymentBadge(order: OrderApiResponse) {
    const method = order.paymentMethod?.toLowerCase() ?? "";
    if (method === "cash" || method === "efectivo") {
      return { label: "Efectivo", color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    if (method === "card" || method === "tarjeta") {
      return { label: "Tarjeta", color: "bg-blue-50 text-blue-700 border-blue-200" };
    }
    if (order.paymentStatus === "APPROVED") {
      return { label: "Pago verificado", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (order.paymentStatus === "PENDING_VERIFICATION") {
      return { label: "Pago pendiente", color: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    if (order.paymentStatus === "REJECTED") {
      return { label: "Pago rechazado", color: "bg-red-50 text-red-600 border-red-200" };
    }
    return { label: "Sin comprobante", color: "bg-slate-100 text-slate-400 border-slate-200" };
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
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
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
                  onClick={() => {
                    if (isExpanded) {
                      setExpandedId(null);
                    } else {
                      setExpandedId(order.id);
                      // Always load proofs if the order has a digital payment method
                      const isDigital = order.paymentMethod === "yape" || order.paymentMethod === "plin" || order.paymentMethod === "card";
                      if (isDigital && !proofsByOrder[order.id]) {
                        loadProofsForOrder(order.id);
                      }
                    }
                  }}
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

                  {/* Payment badge */}
                  {(() => {
                    const pb = getPaymentBadge(order);
                    return (
                      <span className={`hidden md:inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${pb.color}`}>
                        {pb.label}
                      </span>
                    );
                  })()}

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
                              {order.deliveryLat && order.deliveryLng && (
                                <a
                                  href={`https://www.google.com/maps?q=${order.deliveryLat},${order.deliveryLng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-[#0c4a6e] hover:underline"
                                >
                                  <MapPin className="h-3.5 w-3.5" />
                                  Ver ubicación en Google Maps
                                </a>
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

                        {/* Progress stepper */}
                        {(() => {
                          const flow = order.deliveryType === "pickup" ? STEPPER_PICKUP : STEPPER_DELIVERY;
                          const stepIdx = flow.findIndex(s => s.status === order.status);
                          if (stepIdx < 0) return null;
                          return (
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center gap-1">
                                {flow.map((step, i) => {
                                  const done = i <= stepIdx;
                                  const StepIcon = step.icon;
                                  return (
                                    <div key={step.status} className="flex flex-1 items-center">
                                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${done ? "bg-[#0c4a6e] text-white" : "bg-slate-100 text-slate-400"}`}>
                                          <StepIcon className="h-4 w-4"/>
                                        </div>
                                        <span className={`text-[10px] font-medium ${done ? "text-[#0c4a6e]" : "text-slate-400"}`}>{step.label}</span>
                                      </div>
                                      {i < flow.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < stepIdx ? "bg-[#0c4a6e]" : "bg-slate-100"}`}/>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Payment verification (Yape/Plin) */}
                        {order.paymentMethod && ["yape", "plin"].includes(order.paymentMethod.toLowerCase()) && (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Verificación de pago ({order.paymentMethod.toUpperCase()})
                              </p>
                              {(() => {
                                const pb = getPaymentBadge(order);
                                return (
                                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${pb.color}`}>
                                    {pb.label}
                                  </span>
                                );
                              })()}
                            </div>

                            {order.paymentStatus === "PENDING_VERIFICATION" && (
                              <>
                                {proofsByOrder[order.id]?.length > 0 ? (
                                  <>
                                    <div className="flex gap-3 flex-wrap">
                                      {proofsByOrder[order.id].map((proof) => (
                                        <div key={proof.id} className="relative group">
                                          <img
                                            src={proof.fileUrl}
                                            alt="Comprobante"
                                            className="h-24 w-24 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => setViewProof(proof)}
                                          />
                                          <button
                                            onClick={() => setViewProof(proof)}
                                            className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors"
                                          >
                                            <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleConfirmProof(proofsByOrder[order.id][0].id, order.id);
                                        }}
                                        disabled={actingProof === proofsByOrder[order.id][0].id}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                                      >
                                        {actingProof === proofsByOrder[order.id][0].id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-4 w-4" />
                                        )}
                                        Aprobar pago
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setRejectingProof({ proofId: proofsByOrder[order.id][0].id, orderId: order.id });
                                        }}
                                        className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        Rechazar
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-slate-400 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando comprobante...
                                  </p>
                                )}
                              </>
                            )}

                            {order.paymentStatus === "APPROVED" && (
                              <div className="space-y-2">
                                <p className="text-sm text-emerald-600 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  Pago verificado{order.paymentVerifiedBy && ` por ${order.paymentVerifiedBy}`}
                                </p>
                                {proofsByOrder[order.id]?.length > 0 && (
                                  <div className="flex gap-2">
                                    {proofsByOrder[order.id].map((proof) => (
                                      <div key={proof.id} className="relative group">
                                        <img
                                          src={proof.fileUrl}
                                          alt="Comprobante"
                                          className="h-20 w-20 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setViewProof(proof)}
                                        />
                                        <button
                                          onClick={() => setViewProof(proof)}
                                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors"
                                        >
                                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {order.paymentStatus === "REJECTED" && (
                              <div className="space-y-2">
                                <p className="text-sm text-red-600 flex items-center gap-2">
                                  <XCircle className="h-4 w-4" /> Pago rechazado
                                </p>
                                {order.paymentRejectionReason && (
                                  <p className="text-xs text-red-500 pl-6">Motivo: {order.paymentRejectionReason}</p>
                                )}
                                {proofsByOrder[order.id]?.length > 0 && (
                                  <div className="flex gap-2">
                                    {proofsByOrder[order.id].map((proof) => (
                                      <div key={proof.id} className="relative group">
                                        <img
                                          src={proof.fileUrl}
                                          alt="Comprobante"
                                          className="h-20 w-20 rounded-lg border border-slate-200 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => setViewProof(proof)}
                                        />
                                        <button
                                          onClick={() => setViewProof(proof)}
                                          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 group-hover:bg-black/20 transition-colors"
                                        >
                                          <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              printTicket(order, tenantName);
                            }}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors ml-auto"
                          >
                            <Printer className="h-4 w-4" />
                            Imprimir ticket
                          </button>
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

      {/* Modal: view payment receipt */}
      <AnimatePresence>
        {viewProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setViewProof(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-ink mb-2">
                Comprobante #{viewProof.orderId.slice(0, 8).toUpperCase()}
              </h3>
              <img
                src={viewProof.fileUrl}
                alt="Comprobante"
                className="w-full rounded-xl border border-slate-200"
              />
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>Método: <span className="font-medium">{viewProof.paymentMethod.toUpperCase()}</span></p>
                <p>Subido: {formatDate(viewProof.createdAt)}</p>
                {viewProof.verifiedBy && <p>Verificado por: {viewProof.verifiedBy}</p>}
                {viewProof.rejectionReason && (
                  <p className="text-red-600">Motivo rechazo: {viewProof.rejectionReason}</p>
                )}
              </div>

              {viewProof.status === "PENDING_VERIFICATION" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleConfirmProof(viewProof.id, viewProof.orderId)}
                    disabled={actingProof === viewProof.id}
                    className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actingProof === viewProof.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Aprobar pago
                  </button>
                  <button
                    onClick={() => {
                      setRejectingProof({ proofId: viewProof.id, orderId: viewProof.orderId });
                      setViewProof(null);
                    }}
                    className="flex-1 rounded-xl bg-red-100 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200 flex items-center justify-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              )}

              <button
                onClick={() => setViewProof(null)}
                className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: reject reason */}
      <AnimatePresence>
        {rejectingProof && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => {
              setRejectingProof(null);
              setRejectReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-sm w-full rounded-2xl bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-ink mb-2">Rechazar comprobante</h3>
              <p className="text-sm text-slate-500 mb-3">
                Indica el motivo del rechazo. El cliente podrá verlo y reenviar su comprobante.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ej: El monto no coincide con el total del pedido"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setRejectingProof(null);
                    setRejectReason("");
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (rejectingProof) handleRejectProof(rejectingProof.proofId, rejectingProof.orderId);
                  }}
                  disabled={!rejectReason.trim() || (rejectingProof ? actingProof === rejectingProof.proofId : false)}
                  className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  Confirmar rechazo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
