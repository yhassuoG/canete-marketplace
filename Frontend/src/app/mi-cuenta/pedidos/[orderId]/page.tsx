"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  ChefHat,
  XCircle,
  Store,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  StickyNote,
  RefreshCw,
  ShoppingBag,
  Bike,
  PackageCheck,
  AlertCircle,
  Upload,
  Loader2,
  Eye,
} from "lucide-react";
import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";
import { useConsumer } from "@/lib/use-consumer";
import {
  fetchTenants,
  uploadPaymentReceipt,
  TenantApiData,
  OrderApiResponse,
} from "@/lib/api";

// ── Status definitions ──────────────────────────────────────────────────────
const STATUS_META: Record<
  string,
  { label: string; color: string; icon: typeof Clock; description: string }
> = {
  pending: {
    label: "Pendiente",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    description: "Tu pedido ha sido recibido por la tienda",
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: CheckCircle2,
    description: "La tienda confirmó tu pedido",
  },
  preparing: {
    label: "Preparando",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    icon: ChefHat,
    description: "Tu pedido está siendo preparado",
  },
  on_the_way: {
    label: "En camino",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: Truck,
    description: "El repartidor va hacia tu dirección",
  },
  ready_for_pickup: {
    label: "Listo para recoger",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    icon: PackageCheck,
    description: "Tu pedido está listo para recoger en la tienda",
  },
  delivered: {
    label: "Entregado",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    description: "¡Pedido entregado! Gracias por tu compra",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-50 text-red-600 border-red-200",
    icon: XCircle,
    description: "Este pedido fue cancelado",
  },
};

// Flujo de estados según tipo de entrega
const FLOW_DELIVERY = [
  "pending",
  "confirmed",
  "preparing",
  "on_the_way",
  "delivered",
];
const FLOW_PICKUP = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_pickup",
  "delivered",
];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Efectivo",
  efectivo: "Efectivo",
  card: "Tarjeta",
  tarjeta: "Tarjeta",
  yape: "Yape",
  plin: "Plin",
  transfer: "Transferencia",
  mercadopago: "Mercado Pago",
  mercado_pago: "Mercado Pago",
};

function formatCurrency(n: number) {
  return `S/${n.toFixed(2)}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("es-PE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortOrderId(id: string) {
  return id.substring(0, 8).toUpperCase();
}

export default function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { account } = useConsumer();
  const [orderId, setOrderId] = useState<string>("");
  const [order, setOrder] = useState<OrderApiResponse | null>(null);
  const [tenant, setTenant] = useState<TenantApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then((p) => setOrderId(p.orderId));
  }, [params]);

  // Nota: No redirigimos a /login si no hay sesión.
  // El endpoint GET /api/v1/orders/{orderId} es público, así que el tracking
  // funciona incluso sin login (útil para compartir el link del pedido).

  // Fetch order by ID (endpoint público)
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`);
      if (!res.ok) {
        setError("No se encontró el pedido");
        setLoading(false);
        return;
      }
      const data = (await res.json()) as OrderApiResponse;
      setOrder(data);
      setError(null);
      setLastUpdated(new Date());
      setLoading(false);

      // Cargar info del tenant si no la tenemos
      if (!tenant && data.tenantId) {
        const tenants = await fetchTenants();
        const t = tenants.find((t) => t.id === data.tenantId);
        if (t) setTenant(t);
      }
    } catch {
      setError("Error de conexión al cargar el pedido");
      setLoading(false);
    }
  }, [orderId, tenant]);

  // Carga inicial
  useEffect(() => {
    if (!orderId) return;
    fetchOrder();
  }, [orderId, fetchOrder]);

  // Auto-refresh cada 5 segundos mientras el pedido esté activo
  useEffect(() => {
    if (!order) return;
    const isFinal =
      order.status === "delivered" || order.status === "cancelled";
    if (isFinal) return;

    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  if (loading) {
    return (
      <TenantGoogleProvider>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
        </div>
      </TenantGoogleProvider>
    );
  }

  if (error || !order) {
    return (
      <TenantGoogleProvider>
        <div className="min-h-screen bg-slate-50">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
              <Link
                href={account ? "/mi-cuenta" : "/marketplace"}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Link>
            </div>
          </header>
          <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 font-medium text-slate-600">
                {error ?? "No se encontró el pedido"}
              </p>
              <Link
                href={account ? "/mi-cuenta" : "/marketplace"}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-coral to-orange-500 px-4 py-2 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                {account ? "Ir a Mis pedidos" : "Ir al marketplace"}
              </Link>
            </div>
          </div>
        </div>
      </TenantGoogleProvider>
    );
  }

  // Determinar flujo según tipo de entrega
  const flow =
    order.deliveryType === "pickup" ? FLOW_PICKUP : FLOW_DELIVERY;
  const currentIdx = flow.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const isFinal = isCancelled || isDelivered;
  const statusInfo = STATUS_META[order.status] ?? STATUS_META.pending;
  const StatusIcon = statusInfo.icon;

  return (
    <TenantGoogleProvider>
      <div className="min-h-screen bg-slate-50">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3 sm:px-6">
            <Link
              href={account ? "/mi-cuenta" : "/marketplace"}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {account ? "Mis pedidos" : "Volver"}
            </Link>
            <div className="flex-1" />
            {!isFinal && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Actualizando en vivo
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
          {/* ── Header del pedido ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="flex items-center gap-4 border-b border-slate-100 p-5">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl border ${statusInfo.color}`}
              >
                <StatusIcon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-slate-800">
                  Pedido #{shortOrderId(order.id)}
                </h1>
                <p className="text-xs text-slate-400">
                  {formatDateTime(order.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* Tienda */}
            {tenant && (
              <div className="flex items-center gap-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <Store className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800">{tenant.name}</p>
                  <p className="text-xs text-slate-400">{tenant.category}</p>
                </div>
                <Link
                  href={`/${tenant.slug}`}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-orange-300 hover:text-orange-600"
                >
                  Ver tienda
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── Timeline / Seguimiento ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h2 className="mb-4 font-semibold text-slate-800">
              Seguimiento del pedido
            </h2>

            {isCancelled ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <XCircle className="h-6 w-6 text-red-500" />
                <div>
                  <p className="font-medium text-red-700">
                    Pedido cancelado
                  </p>
                  <p className="text-xs text-red-500">
                    Este pedido fue cancelado. Contacta a la tienda si tienes
                    preguntas.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Línea vertical de conexión */}
                <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-200" />
                {/* Línea de progreso (rellena hasta el paso actual) */}
                <div
                  className="absolute left-5 top-5 w-0.5 bg-gradient-to-b from-orange-400 to-emerald-400 transition-all duration-500"
                  style={{
                    height: `calc((100% - 2.5rem) * ${
                      currentIdx / (flow.length - 1)
                    })`,
                  }}
                />

                <div className="space-y-5">
                  {flow.map((status, idx) => {
                    const meta = STATUS_META[status];
                    if (!meta) return null;
                    const Icon = meta.icon;
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div
                        key={status}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className={`relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isDone
                              ? "border-emerald-400 bg-emerald-50"
                              : "border-slate-200 bg-white"
                          } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
                        >
                          <Icon
                            className={`h-5 w-5 transition-colors ${
                              isDone
                                ? "text-emerald-600"
                                : "text-slate-300"
                            }`}
                          />
                        </div>
                        <div className="flex-1 pt-1.5">
                          <p
                            className={`text-sm font-medium transition-colors ${
                              isDone
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {meta.label}
                          </p>
                          {isCurrent && (
                            <motion.p
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-xs text-slate-500"
                            >
                              {meta.description}
                            </motion.p>
                          )}
                          {isDone && !isCurrent && (
                            <p className="text-xs text-emerald-500">
                              Completado
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Detalles del pedido ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="flex items-center gap-2 font-semibold text-slate-800">
                <ShoppingBag className="h-4 w-4" />
                Productos
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {item.productName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatCurrency(item.subtotal)}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-slate-100 px-5 py-4">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.deliveryType === "delivery" &&
                order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Costo de envío</span>
                    <span>{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Descuento</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-800">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </motion.div>

          {/* ── Información de entrega ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <h2 className="mb-4 font-semibold text-slate-800">
              Información del pedido
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Tipo de entrega */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                {order.deliveryType === "pickup" ? (
                  <PackageCheck className="h-5 w-5 text-slate-500" />
                ) : (
                  <Bike className="h-5 w-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs text-slate-400">Entrega</p>
                  <p className="text-sm font-medium text-slate-700">
                    {order.deliveryType === "pickup"
                      ? "Recoger en tienda"
                      : "Delivery a domicilio"}
                  </p>
                </div>
              </div>

              {/* Método de pago */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                {order.paymentMethod === "cash" ||
                order.paymentMethod === "efectivo" ? (
                  <Banknote className="h-5 w-5 text-slate-500" />
                ) : (
                  <CreditCard className="h-5 w-5 text-slate-500" />
                )}
                <div>
                  <p className="text-xs text-slate-400">Pago</p>
                  <p className="text-sm font-medium text-slate-700">
                    {order.paymentMethod
                      ? PAYMENT_LABELS[order.paymentMethod] ??
                        order.paymentMethod
                      : "No especificado"}
                  </p>
                </div>
              </div>

              {/* Cliente */}
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <Phone className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-xs text-slate-400">Contacto</p>
                  <p className="text-sm font-medium text-slate-700">
                    {order.customerName}
                  </p>
                  {order.customerPhone && (
                    <p className="text-xs text-slate-400">
                      {order.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              {/* Dirección */}
              {order.deliveryType === "delivery" &&
                order.customerAddress && (
                  <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                    <MapPin className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="text-xs text-slate-400">Dirección</p>
                      <p className="text-sm font-medium text-slate-700">
                        {order.customerAddress}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {/* Notas */}
            {order.notes && (
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-amber-50 p-3">
                <StickyNote className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-xs text-amber-600">Notas</p>
                  <p className="text-sm text-amber-800">{order.notes}</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── Estado de pago Yape/Plin nativo ─────────────────────── */}
          {order.paymentStatus && (
            <PaymentVerificationBlock order={order} onReuploaded={fetchOrder} />
          )}

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Última actualización: {lastUpdated.toLocaleTimeString("es-PE")}</span>
            <button
              type="button"
              onClick={() => fetchOrder()}
              className="flex items-center gap-1 hover:text-slate-600"
            >
              <RefreshCw className="h-3 w-3" />
              Actualizar
            </button>
          </div>
        </div>
      </div>
    </TenantGoogleProvider>
  );
}

// ── Bloque de verificación de pago Yape/Plin ──────────────────────────────
function PaymentVerificationBlock({
  order,
  onReuploaded,
}: {
  order: OrderApiResponse;
  onReuploaded: () => void;
}) {
  const [reuploading, setReuploading] = useState(false);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const isPending = order.paymentStatus === "PENDING_VERIFICATION";
  const isApproved = order.paymentStatus === "APPROVED";
  const isRejected = order.paymentStatus === "REJECTED";

  const handleReupload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea imagen
    if (!file.type.startsWith("image/")) {
      setReuploadError("El archivo debe ser una imagen");
      return;
    }
    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setReuploadError("La imagen no debe superar 5MB");
      return;
    }

    setReuploading(true);
    setReuploadError(null);

    try {
      const res = await uploadPaymentReceipt(
        order.id,
        file,
        order.customerId ?? undefined,
        order.customerName
      );
      if (res) {
        onReuploaded();
      } else {
        setReuploadError("No se pudo subir el comprobante");
      }
    } catch {
      setReuploadError("Error al subir");
    } finally {
      setReuploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <h2 className="mb-4 font-semibold text-slate-800">
        Verificación de pago
      </h2>

      {/* Estado */}
      <div
        className={`flex items-center gap-3 rounded-xl p-4 ${
          isApproved
            ? "bg-emerald-50"
            : isPending
            ? "bg-amber-50"
            : "bg-red-50"
        }`}
      >
        {isApproved ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        ) : isPending ? (
          <Clock className="h-6 w-6 text-amber-500" />
        ) : (
          <XCircle className="h-6 w-6 text-red-500" />
        )}
        <div className="flex-1">
          <p
            className={`font-medium ${
              isApproved
                ? "text-emerald-700"
                : isPending
                ? "text-amber-700"
                : "text-red-700"
            }`}
          >
            {isApproved
              ? "Pago verificado"
              : isPending
              ? "Pago en verificación"
              : "Pago rechazado"}
          </p>
          <p
            className={`text-xs ${
              isApproved
                ? "text-emerald-600"
                : isPending
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {isApproved
              ? `Verificado por ${order.paymentVerifiedBy ?? "el negocio"}`
              : isPending
              ? "El negocio está revisando tu comprobante"
              : order.paymentRejectionReason ??
                "El comprobante fue rechazado"}
          </p>
        </div>
      </div>

      {/* Ver comprobante */}
      {order.paymentReceiptUrl && (
        <div className="mt-3">
          <button
            onClick={() => setShowReceipt(!showReceipt)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            {showReceipt ? "Ocultar comprobante" : "Ver comprobante"}
          </button>
          {showReceipt && (
            <img
              src={order.paymentReceiptUrl}
              alt="Comprobante de pago"
              className="mt-2 w-full max-w-xs rounded-xl border border-slate-200"
            />
          )}
        </div>
      )}

      {/* Re-subir si fue rechazado */}
      {isRejected && (
        <div className="mt-4">
          <p className="text-sm text-slate-600 mb-2">
            Puedes reenviar tu comprobante:
          </p>
          <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 cursor-pointer hover:border-orange-400">
            {reuploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Reenviar comprobante
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReupload}
              disabled={reuploading}
            />
          </label>
          {reuploadError && (
            <p className="mt-2 text-xs text-red-600">{reuploadError}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
