"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Calendar,
  Users,
  ShoppingBag,
  Star,
  MapPin,
  Bell,
  Sparkles,
  Clock,
  CheckCircle2,
  Package,
  X,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientOnly } from "@/components/ui/client-only";
import { useNotifications } from "@/components/dashboard/notification-provider";
import {
  fetchBusinessAnalytics,
  fetchRevenueSeries,
  fetchOrdersByTenant,
  fetchTenant,
  fetchProducts,
  type BusinessAnalytics,
  type RevenueSeriesEntry,
  type OrderApiResponse,
  type TenantApiData,
  type Product,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { isTenantNow } from "@/lib/themes";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BusinessDashboard() {
  const [biz, setBiz] = useState<BusinessAnalytics | null>(null);
  const [series, setSeries] = useState<RevenueSeriesEntry[]>([]);
  const [orders, setOrders] = useState<OrderApiResponse[]>([]);
  const [tenant, setTenant] = useState<TenantApiData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAllRead, markRead, clearAll } = useNotifications();

  // Close bell dropdown on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  useEffect(() => {
    const user = getAuthUser();
    const slug = user?.tenantSlug;
    if (!slug) return;

    fetchBusinessAnalytics(slug).then(setBiz);
    fetchRevenueSeries().then(setSeries);
    fetchTenant(slug).then(setTenant);
    fetchProducts(slug).then((p) => p && setProducts(p));

    // Need tenant UUID to fetch orders
    fetchTenant(slug).then((t) => {
      if (t?.id) fetchOrdersByTenant(t.id).then(setOrders);
    });
  }, []);

  const weeklyChart = series.map((s) => ({
    day: s.date.slice(8),
    sales: s.revenue,
    orders: s.orders,
  }));

  const topProducts = [...products]
    .slice(0, 4)
    .map((p) => ({ name: p.name, price: p.price }));

  const recentOrders = orders.slice(0, 5);

  const tenantName = tenant?.name ?? getAuthUser()?.tenantName ?? "Mi Negocio";
  const tenantLocation = tenant?.location ?? "—";
  const tenantRating = tenant?.rating ?? 0;
  const tenantReviews = tenant?.reviewCount ?? 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold text-ink">{tenantName}</h1>
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <MapPin className="h-3.5 w-3.5" />
            {tenantLocation}
            <span className="mx-1 text-slate-200">·</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {tenantRating} ({tenantReviews} reseñas)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(() => {
            const status = isTenantNow(tenant?.openingHours);
            if (status === null) return null;
            return (
              <div className={`hidden md:flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium ${status.open ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${status.open ? "bg-emerald-500" : "bg-red-500"}`} />
                {status.open ? "Abierto ahora" : "Cerrado ahora"}
              </div>
            );
          })()}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => {
                setBellOpen((v) => !v);
                if (!bellOpen) markAllRead();
              }}
              className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-ink transition-colors"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            <AnimatePresence>
              {bellOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden z-50"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-ink">Notificaciones</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAll}
                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">Sin notificaciones</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                      {notifications.slice(0, 20).map((n) => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !n.read ? "bg-amber-50/40" : ""
                          }`}
                          onClick={() => markRead(n.id)}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#083d77]">
                            <Package className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-ink truncate">{n.message}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(n.timestamp).toLocaleString("es-PE", {
                                hour: "2-digit",
                                minute: "2-digit",
                                day: "2-digit",
                                month: "short",
                              })}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="h-2 w-2 rounded-full bg-coral flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ventas totales"
            value={biz?.totalSales ?? 0}
            growth={biz?.salesGrowth ?? 0}
            prefix="S/"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            delay={0}
          />
          <MetricCard
            label="Reservas (mes)"
            value={biz?.totalReservations ?? 0}
            growth={biz?.reservationGrowth ?? 0}
            icon={<Calendar className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
            delay={0.07}
          />
          <MetricCard
            label="Clientes únicos"
            value={biz?.totalCustomers ?? 0}
            growth={biz?.customerGrowth ?? 0}
            icon={<Users className="h-5 w-5 text-violet-600" />}
            iconBg="bg-violet-50"
            delay={0.14}
          />
          <MetricCard
            label="Pedidos totales"
            value={biz?.totalOrders ?? 0}
            growth={biz?.orderGrowth ?? 0}
            icon={<ShoppingBag className="h-5 w-5 text-orange-600" />}
            iconBg="bg-orange-50"
            delay={0.21}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Weekly sales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Ventas — últimas 4 semanas</h3>
                <p className="text-sm text-slate-400">Ingresos en soles</p>
              </div>
              <div className="flex gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0c4a6e]" /> Ventas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#f97316]" /> Pedidos
                </span>
              </div>
            </div>
            <ClientOnly fallback={<div className="h-[210px]" />}>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={weeklyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c4a6e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0c4a6e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }} />
                  <Area type="monotone" dataKey="sales" stroke="#0c4a6e" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          </motion.div>

          {/* Top products */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
          >
            <h3 className="mb-5 font-semibold text-ink">Productos destacados</h3>
            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400">Sin productos.</p>
            ) : (
              <ul className="space-y-4">
                {topProducts.map((p, i) => (
                  <li key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">{p.name}</span>
                      <span className="text-xs text-slate-400">S/{p.price}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${100 - i * 20}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full bg-[#0c4a6e]"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        {/* Recent orders */}
        <div className="grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            className="col-span-3 rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h3 className="font-semibold text-ink">Pedidos recientes</h3>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-400">Sin pedidos recientes.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                        {(o.customerName ?? "?").split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{o.customerName ?? "Cliente"}</p>
                        <p className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          {o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-PE") : "—"} · {o.deliveryType ?? "delivery"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink">S/{o.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.40 }}
            className="col-span-2 rounded-3xl bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#0891b2] p-6 text-white shadow-soft"
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h3 className="font-semibold">Resumen del negocio</h3>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm text-white/90">
                  Rating promedio: <span className="font-semibold">{biz?.avgRating ?? 0} ⭐</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm text-white/90">
                  Pedidos: <span className="font-semibold">{biz?.totalOrders ?? 0}</span> · Clientes: <span className="font-semibold">{biz?.totalCustomers ?? 0}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <p className="text-sm text-white/90">
                  Crecimiento de ventas: <span className="font-semibold">{biz?.salesGrowth ?? 0}%</span>
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/10 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
              <p className="text-xs text-white/70">Datos en tiempo real desde la base de datos</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
