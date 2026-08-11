"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  Activity,
  Bell,
  Search,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { CompaniesTable } from "@/components/admin/companies-table";
import { ClientOnly } from "@/components/ui/client-only";
import {
  fetchGlobalAnalytics,
  fetchRevenueSeries,
  fetchCategoryBreakdown,
  fetchUsers,
  type GlobalAnalytics,
  type RevenueSeriesEntry,
  type CategoryBreakdownEntry,
  type UserApiData,
} from "@/lib/api";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<GlobalAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueSeriesEntry[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdownEntry[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserApiData[]>([]);

  useEffect(() => {
    fetchGlobalAnalytics().then(setMetrics);
    fetchRevenueSeries().then(setRevenue);
    fetchCategoryBreakdown().then(setCategories);
    fetchUsers().then((users) =>
      setRecentUsers(
        users
          .filter((u) => u.lastLoginAt)
          .sort((a, b) => (b.lastLoginAt ?? "").localeCompare(a.lastLoginAt ?? ""))
          .slice(0, 6)
      )
    );
  }, []);

  const revenueChart = revenue.map((r) => ({
    date: r.date.slice(5),
    revenue: r.revenue,
    orders: r.orders,
    reservations: r.reservations,
  }));

  const totalCat = categories.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold text-ink">Dashboard Global</h1>
          <p className="text-sm text-slate-400">Vista general de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-400">
            <Search className="h-4 w-4" />
            <span>Buscar...</span>
          </div>
          <button className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral" />
          </button>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Revenue total"
            value={metrics?.totalRevenue ?? 0}
            growth={metrics?.revenueGrowth ?? 0}
            prefix="S/"
            icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
            delay={0}
          />
          <MetricCard
            label="Empresas registradas"
            value={metrics?.totalCompanies ?? 0}
            growth={0}
            icon={<Building2 className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
            delay={0.07}
          />
          <MetricCard
            label="Usuarios activos"
            value={metrics?.totalUsers ?? 0}
            growth={metrics?.newUsersThisMonth ? (metrics.newUsersThisMonth / Math.max(metrics.totalUsers, 1)) * 100 : 0}
            icon={<Users className="h-5 w-5 text-violet-600" />}
            iconBg="bg-violet-50"
            delay={0.14}
          />
          <MetricCard
            label="Transacciones"
            value={metrics?.totalTransactions ?? 0}
            growth={0}
            icon={<TrendingUp className="h-5 w-5 text-orange-600" />}
            iconBg="bg-orange-50"
            delay={0.21}
          />
        </div>

        {/* Charts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue area chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-ink">Revenue — últimas 4 semanas</h3>
                <p className="text-sm text-slate-400">Ingresos consolidados de todos los negocios</p>
              </div>
              <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-ocean" /> Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-coral" /> Pedidos
                </span>
              </div>
            </div>
            <ClientOnly fallback={<div className="h-[220px]" />}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={revenueChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#083d77" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#083d77" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff7a59" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ff7a59" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#083d77" strokeWidth={2.5} fill="url(#revGrad)" />
                  <Area type="monotone" dataKey="orders" stroke="#ff7a59" strokeWidth={2} fill="url(#ordGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          </motion.div>

          {/* Category breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
          >
            <h3 className="mb-1 font-semibold text-ink">Por categoría</h3>
            <p className="mb-5 text-sm text-slate-400">Distribución de empresas</p>
            <div className="flex justify-center">
              <ClientOnly fallback={<div className="h-[160px] w-[160px]" />}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={categories}
                    cx={75}
                    cy={75}
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categories.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ClientOnly>
            </div>
            <ul className="mt-4 space-y-2">
              {categories.map((d) => (
                <li key={d.category} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    {d.category}
                  </span>
                  <span className="font-semibold text-ink">{Math.round((d.value / totalCat) * 100)}%</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Companies table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <CompaniesTable />
        </motion.div>

        {/* Recent activity — logins recientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
        >
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-ocean" />
            <h3 className="font-semibold text-ink">Inicios de sesión recientes</h3>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400">Sin actividad reciente.</p>
          ) : (
            <ul className="space-y-4">
              {recentUsers.map((u) => (
                <li key={u.id} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-ink">{u.fullName} ({u.email})</p>
                    <p className="text-xs text-slate-400">
                      {u.role} · {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("es-PE") : "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}
