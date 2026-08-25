"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Package,
  Heart,
  Gift,
  MapPin,
  Settings,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  Star,
  Store,
  LogOut,
  ShoppingBag,
  Plus,
  X,
  Trash2,
  Pencil,
} from "lucide-react";
import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";
import { useConsumer } from "@/lib/use-consumer";
import {
  fetchOrdersByAccount,
  fetchTenants,
  fetchRewards,
  fetchAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  OrderApiResponse,
  TenantApiData,
  RewardApiData,
  AddressApiData,
} from "@/lib/api";

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_FLOW: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-slate-100 text-slate-700 border-slate-200" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  preparing: { label: "Preparando", color: "bg-purple-100 text-purple-700 border-purple-200" },
  on_the_way: { label: "En camino", color: "bg-amber-100 text-amber-700 border-amber-200" },
  delivered: { label: "Entregado", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
};

function statusLabel(status: string): string {
  return STATUS_FLOW[status]?.label ?? status;
}

function statusColor(status: string): string {
  return STATUS_FLOW[status]?.color ?? "bg-slate-100 text-slate-700 border-slate-200";
}

type Section = "overview" | "orders" | "favorites" | "rewards" | "addresses" | "settings";

const NAV_ITEMS: { id: Section; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "Resumen", icon: Sparkles },
  { id: "orders", label: "Mis pedidos", icon: Package },
  { id: "favorites", label: "Tiendas favoritas", icon: Heart },
  { id: "rewards", label: "Recompensas", icon: Gift },
  { id: "addresses", label: "Direcciones", icon: MapPin },
  { id: "settings", label: "Configuración", icon: Settings },
];

export default function MiCuentaPage() {
  const router = useRouter();
  const { account, hydrated, logout, subscribe, unsubscribe } = useConsumer();
  const [section, setSection] = useState<Section>("overview");
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<OrderApiResponse[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [tenantMap, setTenantMap] = useState<Record<string, TenantApiData>>({});
  const [rewards, setRewards] = useState<RewardApiData[]>([]);
  const [addresses, setAddresses] = useState<AddressApiData[]>([]);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState<AddressApiData | null>(null);
  const [addrForm, setAddrForm] = useState({
    label: "Casa",
    recipientName: "",
    phone: "",
    addressLine: "",
    reference: "",
    isDefault: false,
  });
  const [addrSubmitting, setAddrSubmitting] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);

  // Redirect to login if not logged in
  useEffect(() => {
    if (hydrated && !account) {
      router.replace("/login");
    }
  }, [hydrated, account, router]);

  // Load all tenants once to build a tenantId → tenant map
  useEffect(() => {
    fetchTenants().then((tenants) => {
      const map: Record<string, TenantApiData> = {};
      for (const t of tenants) map[t.id] = t;
      setTenantMap(map);
    });
  }, []);

  // Load orders for the logged-in marketplace account
  useEffect(() => {
    if (!account) return;
    setOrdersLoading(true);
    fetchOrdersByAccount(account.id).then((data) => {
      setOrders(data);
      setOrdersLoading(false);
    });
  }, [account]);

  // Load rewards (global + all active tenants — we pass no tenantSlug to get global)
  useEffect(() => {
    fetchRewards().then(setRewards);
  }, []);

  // Load addresses for the logged-in account
  useEffect(() => {
    if (!account) return;
    fetchAddresses(account.id).then(setAddresses);
  }, [account]);

  // Address handlers
  function openCreateAddr() {
    setEditingAddr(null);
    setAddrForm({ label: "Casa", recipientName: account?.name ?? "", phone: "", addressLine: "", reference: "", isDefault: false });
    setAddrError(null);
    setShowAddrModal(true);
  }

  function openEditAddr(a: AddressApiData) {
    setEditingAddr(a);
    setAddrForm({
      label: a.label,
      recipientName: a.recipientName ?? "",
      phone: a.phone ?? "",
      addressLine: a.addressLine,
      reference: a.reference ?? "",
      isDefault: a.isDefault,
    });
    setAddrError(null);
    setShowAddrModal(true);
  }

  async function handleAddrSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!account) return;
    setAddrSubmitting(true);
    setAddrError(null);

    const payload = {
      label: addrForm.label,
      recipientName: addrForm.recipientName || null,
      phone: addrForm.phone || null,
      addressLine: addrForm.addressLine,
      reference: addrForm.reference || null,
      isDefault: addrForm.isDefault,
    };

    const result = editingAddr
      ? await updateAddress(editingAddr.id, account.id, payload)
      : await createAddress(account.id, payload);

    if (!result.ok) {
      setAddrError(result.error ?? "Error desconocido");
      setAddrSubmitting(false);
      return;
    }

    const refreshed = await fetchAddresses(account.id);
    setAddresses(refreshed);
    setShowAddrModal(false);
    setAddrSubmitting(false);
  }

  async function handleAddrDelete(id: string) {
    if (!account) return;
    if (!confirm("¿Eliminar esta dirección?")) return;
    const result = await deleteAddress(id, account.id);
    if (result.ok) {
      setAddresses((current) => current.filter((a) => a.id !== id));
    }
  }

  if (!hydrated || !account) {
    return (
      <TenantGoogleProvider>
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
        </div>
      </TenantGoogleProvider>
    );
  }

  // Tenants reales del API
  const allTenantsList = Object.values(tenantMap).filter((t) => t.status === "active");
  const favoriteTenants = allTenantsList.filter((t) =>
    account.subscribedTenants.includes(t.slug)
  );
  const filteredTenants = search
    ? allTenantsList.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.category.toLowerCase().includes(search.toLowerCase())
      )
    : allTenantsList;

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
  const loyaltyPoints = Math.floor(totalSpent * 10);

  const handleLogout = () => {
    logout();
    router.push("/marketplace");
  };

  return (
    <TenantGoogleProvider>
      <div className="min-h-screen bg-slate-50">
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <Link href="/marketplace" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-orange-500">
                <span className="text-lg font-bold text-white">C</span>
              </div>
              <span className="hidden font-bold text-slate-800 sm:inline">Cañete</span>
            </Link>

            {/* Search */}
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tiendas, productos, categorías..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-orange-500" />
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt={account.name} className="h-7 w-7 rounded-lg object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-coral to-orange-500 text-xs font-bold text-white">
                  {account.name[0]}
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-700 sm:inline">
                {account.name.split(" ")[0]}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
          {/* ── Sidebar ───────────────────────────────────────────────── */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-20 space-y-1">
              {/* User card */}
              <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt={account.name} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-orange-500 text-lg font-bold text-white">
                      {account.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-800">{account.name}</p>
                    <p className="truncate text-xs text-slate-400">{account.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2">
                  <Gift className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium text-orange-700">{loyaltyPoints} puntos</span>
                </div>
              </div>

              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSection(item.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      section === item.id
                        ? "bg-gradient-to-br from-coral to-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </aside>

          {/* ── Main content ──────────────────────────────────────────── */}
          <main className="flex-1 min-w-0">
            {/* Mobile section selector */}
            <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex-shrink-0 rounded-full px-4 py-2 text-xs font-medium transition ${
                    section === item.id
                      ? "bg-gradient-to-br from-coral to-orange-500 text-white"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW ───────────────────────────────────────────── */}
            {section === "overview" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Welcome banner */}
                <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/60">¡Hola de nuevo!</p>
                      <h1 className="mt-1 text-2xl font-bold">{account.name.split(" ")[0]} 👋</h1>
                      <p className="mt-2 text-sm text-white/50">
                        Tienes {orders.filter(o => o.status === "on_the_way").length} pedidos en camino y {loyaltyPoints} puntos disponibles.
                      </p>
                    </div>
                    <div className="hidden h-20 w-20 items-center justify-center rounded-2xl bg-white/10 sm:flex">
                      <Sparkles className="h-10 w-10 text-orange-400" />
                    </div>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: "Pedidos totales", value: orders.length, icon: Package, color: "text-blue-600 bg-blue-50" },
                    { label: "Gastado", value: `S/.${totalSpent.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
                    { label: "Tiendas fav.", value: favoriteTenants.length, icon: Heart, color: "text-rose-600 bg-rose-50" },
                    { label: "Puntos", value: loyaltyPoints, icon: Gift, color: "text-orange-600 bg-orange-50" },
                  ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Recent orders */}
                <div className="rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <h2 className="font-semibold text-slate-800">Pedidos recientes</h2>
                    <button onClick={() => setSection("orders")} className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700">
                      Ver todos <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {ordersLoading ? (
                      <div className="px-5 py-8 text-center text-sm text-slate-400">Cargando pedidos…</div>
                    ) : orders.length === 0 ? (
                      <div className="px-5 py-8 text-center text-sm text-slate-400">Aún no tienes pedidos</div>
                    ) : (
                      orders.slice(0, 3).map((order) => (
                        <Link
                          key={order.id}
                          href={`/mi-cuenta/pedidos/${order.id}`}
                          className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                            🧾
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800">{tenantMap[order.tenantId]?.name ?? "Tienda"}</p>
                            <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString("es-PE")} · {order.items.length} items</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                          <p className="text-sm font-semibold text-slate-800">S/.{order.total.toFixed(2)}</p>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                {/* Recommended stores */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800">Tiendas recomendadas</h2>
                    <Link href="/marketplace" className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700">
                      Explorar todas <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredTenants.slice(0, 6).map((biz) => (
                      <Link
                        key={biz.id}
                        href={`/${biz.slug}`}
                        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-orange-200 hover:shadow-lg"
                      >
                        <div
                          className="flex h-24 items-center justify-center"
                          style={{ background: biz.gradient || "linear-gradient(135deg, #fb923c, #f43f5e)" }}
                        >
                          {biz.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={biz.logoUrl} alt={biz.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-3xl">🏪</span>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-slate-800 group-hover:text-orange-600 transition">{biz.name}</p>
                              <p className="text-xs text-slate-400">{biz.category}</p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-amber-500">
                              <Star className="h-3 w-3 fill-current" />
                              {biz.rating.toFixed(1)}
                            </div>
                          </div>
                          <p className="mt-2 truncate text-xs text-slate-400">{biz.tagline}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── ORDERS ─────────────────────────────────────────────── */}
            {section === "orders" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-xl font-bold text-slate-800">Mis pedidos</h1>
                {ordersLoading ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
                    Cargando pedidos…
                  </div>
                ) : orders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-slate-300" />
                    <p className="mt-3 font-medium text-slate-600">Aún no tienes pedidos</p>
                    <p className="mt-1 text-sm text-slate-400">Realiza tu primera compra en cualquier tienda</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const tenant = tenantMap[order.tenantId];
                    return (
                      <div key={order.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <Link href={`/mi-cuenta/pedidos/${order.id}`} className="flex items-center gap-4 border-b border-slate-100 px-5 py-3 transition hover:bg-slate-50">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                            🧾
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{tenant?.name ?? "Tienda"}</p>
                            <p className="text-xs text-slate-400">Pedido {order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString("es-PE")}</p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusColor(order.status)}`}>
                            {statusLabel(order.status)}
                          </span>
                        </Link>
                        <div className="px-5 py-3">
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">{item.productName} ×{item.quantity}</span>
                                <span className="text-slate-400">S/.{item.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="flex items-center gap-3">
                              <Link
                                href={`/mi-cuenta/pedidos/${order.id}`}
                                className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700"
                              >
                                <Package className="h-3 w-3" /> Ver seguimiento
                              </Link>
                              <Link
                                href={tenant ? `/${tenant.slug}` : "/marketplace"}
                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
                              >
                                <Store className="h-3 w-3" /> Ver tienda
                              </Link>
                            </div>
                            <p className="font-semibold text-slate-800">Total: S/.{order.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* ── FAVORITES ──────────────────────────────────────────── */}
            {section === "favorites" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-xl font-bold text-slate-800">Tiendas favoritas</h1>

                {/* Favoritos actuales */}
                {favoriteTenants.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500">Tus tiendas favoritas ({favoriteTenants.length})</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {favoriteTenants.map((tenant) => (
                        <div
                          key={tenant.id}
                          className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-md"
                        >
                          <Link href={`/${tenant.slug}`} className="flex flex-1 items-center gap-4 min-w-0">
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl overflow-hidden"
                              style={{ background: tenant.gradient || "linear-gradient(135deg, #fb923c, #f43f5e)" }}
                            >
                              {tenant.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                              ) : (
                                <span>🏪</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-semibold text-slate-800">{tenant.name}</p>
                              <p className="truncate text-xs text-slate-400">{tenant.tagline}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {tenant.rating.toFixed(1)} · {tenant.location}
                              </div>
                            </div>
                          </Link>
                          <button
                            type="button"
                            onClick={() => unsubscribe(tenant.slug)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-50"
                            title="Quitar de favoritos"
                          >
                            <Heart className="h-5 w-5 fill-rose-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Explorar tiendas para agregar como favoritas */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-500">
                    {favoriteTenants.length === 0 ? "Explora tiendas y márcalas como favoritas" : "Explorar más tiendas"}
                  </p>

                  {allTenantsList.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                      <Store className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-2 text-sm text-slate-400">Cargando tiendas...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {allTenantsList
                        .filter((t) => !account.subscribedTenants.includes(t.slug))
                        .map((tenant) => (
                          <div
                            key={tenant.id}
                            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-md"
                          >
                            <Link href={`/${tenant.slug}`} className="flex flex-1 items-center gap-4 min-w-0">
                              <div
                                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl overflow-hidden"
                                style={{ background: tenant.gradient || "linear-gradient(135deg, #fb923c, #f43f5e)" }}
                              >
                                {tenant.logoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={tenant.logoUrl} alt={tenant.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span>🏪</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="truncate font-semibold text-slate-800">{tenant.name}</p>
                                <p className="truncate text-xs text-slate-400">{tenant.tagline}</p>
                                <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {tenant.rating.toFixed(1)} · {tenant.location}
                                </div>
                              </div>
                            </Link>
                            <button
                              type="button"
                              onClick={() => subscribe(tenant.slug)}
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                              title="Agregar a favoritos"
                            >
                              <Heart className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {favoriteTenants.length === 0 && allTenantsList.length > 0 && (
                    <Link
                      href="/marketplace"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-coral to-orange-500 px-4 py-2 text-sm font-medium text-white"
                    >
                      <ShoppingBag className="h-4 w-4" /> Explorar marketplace
                    </Link>
                  )}
                </div>
              </motion.div>
            )}



            {/* ── REWARDS ───────────────────────────────────────────── */}
            {section === "rewards" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-slate-800">Recompensas disponibles</h1>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                    {loyaltyPoints} pts
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  Acumulas 10 puntos por cada S/1 de consumo. Canjea tus puntos por estas recompensas.
                </p>
                {rewards.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <Gift className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">No hay recompensas disponibles por ahora.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {rewards.map((r) => {
                      const canRedeem = loyaltyPoints >= r.costPoints;
                      return (
                        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                          <div className="flex items-start gap-3">
                            {r.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={r.imageUrl} alt={r.title} className="h-16 w-16 rounded-xl object-cover" />
                            ) : (
                              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                                {r.emoji}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{r.title}</p>
                              {r.description ? (
                                <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.description}</p>
                              ) : null}
                              <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                  {r.costPoints} pts
                                </span>
                                {canRedeem ? (
                                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Disponible</span>
                                ) : (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                    Faltan {r.costPoints - loyaltyPoints} pts
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ADDRESSES ──────────────────────────────────────────── */}
            {section === "addresses" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold text-slate-800">Mis direcciones</h1>
                  <button
                    type="button"
                    onClick={openCreateAddr}
                    className="flex items-center gap-1 rounded-xl bg-gradient-to-br from-coral to-orange-500 px-4 py-2 text-sm font-medium text-white"
                  >
                    <Plus className="h-4 w-4" /> Agregar
                  </button>
                </div>
                {addresses.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                    <MapPin className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                    <p className="text-sm text-slate-500">No tienes direcciones guardadas.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {addresses.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-orange-500" />
                            <p className="font-medium text-slate-800">{a.label}</p>
                            {a.isDefault && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">Predeterminada</span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => openEditAddr(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleAddrDelete(a.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">{a.addressLine}</p>
                        {a.recipientName ? <p className="mt-1 text-xs text-slate-400">Para: {a.recipientName}</p> : null}
                        {a.phone ? <p className="text-xs text-slate-400">Tel: {a.phone}</p> : null}
                        {a.reference ? <p className="mt-1 text-xs text-slate-400">Ref: {a.reference}</p> : null}
                      </div>
                    ))}
                  </div>
                )}

                {/* Modal crear/editar dirección */}
                {showAddrModal ? (
                  <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
                      <div className="mb-6 flex items-start justify-between">
                        <h2 className="text-xl font-semibold text-slate-800">{editingAddr ? "Editar dirección" : "Nueva dirección"}</h2>
                        <button type="button" onClick={() => setShowAddrModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <form className="grid gap-3" onSubmit={handleAddrSubmit}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <input value={addrForm.label} onChange={(e) => setAddrForm((c) => ({ ...c, label: e.target.value }))} placeholder="Etiqueta (Casa, Trabajo...)" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" required />
                          <input value={addrForm.recipientName} onChange={(e) => setAddrForm((c) => ({ ...c, recipientName: e.target.value }))} placeholder="Nombre del destinatario" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" />
                        </div>
                        <input value={addrForm.phone} onChange={(e) => setAddrForm((c) => ({ ...c, phone: e.target.value }))} placeholder="Teléfono" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" />
                        <textarea value={addrForm.addressLine} onChange={(e) => setAddrForm((c) => ({ ...c, addressLine: e.target.value }))} placeholder="Dirección completa" className="min-h-20 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" required />
                        <textarea value={addrForm.reference} onChange={(e) => setAddrForm((c) => ({ ...c, reference: e.target.value }))} placeholder="Referencia (opcional)" className="min-h-16 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none" />
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={addrForm.isDefault} onChange={(e) => setAddrForm((c) => ({ ...c, isDefault: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" />
                          Establecer como predeterminada
                        </label>
                        {addrError ? <p className="text-sm text-rose-600">{addrError}</p> : null}
                        <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setShowAddrModal(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600">Cancelar</button>
                          <button type="submit" disabled={addrSubmitting} className="rounded-xl bg-gradient-to-br from-coral to-orange-500 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">
                            {addrSubmitting ? "Guardando..." : "Guardar"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* ── SETTINGS ───────────────────────────────────────────── */}
            {section === "settings" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="text-xl font-bold text-slate-800">Configuración</h1>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-4 font-semibold text-slate-800">Perfil</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Nombre</label>
                      <input
                        type="text"
                        defaultValue={account.name}
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Correo</label>
                      <input
                        type="email"
                        defaultValue={account.email}
                        disabled
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 font-semibold text-slate-800">Notificaciones</h2>
                  {[
                    "Ofertas y promociones",
                    "Estado de mis pedidos",
                    "Novedades de tiendas favoritas",
                  ].map((label) => (
                    <label key={label} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">{label}</span>
                      <input type="checkbox" defaultChecked className="h-5 w-9 rounded-full bg-slate-200 appearance-none checked:bg-orange-500 transition" />
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </TenantGoogleProvider>
  );
}
