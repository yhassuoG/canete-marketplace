"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Building2, Users, ShoppingBag } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientOnly } from "@/components/ui/client-only";
import {
  fetchGlobalAnalytics,
  fetchRevenueSeries,
  fetchCategoryBreakdown,
  fetchTopTenants,
  type GlobalAnalytics,
  type RevenueSeriesEntry,
  type CategoryBreakdownEntry,
  type TopTenantEntry,
} from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [metrics, setMetrics] = useState<GlobalAnalytics | null>(null);
  const [revenue, setRevenue] = useState<RevenueSeriesEntry[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdownEntry[]>([]);
  const [topTenants, setTopTenants] = useState<TopTenantEntry[]>([]);

  useEffect(() => {
    fetchGlobalAnalytics().then(setMetrics);
    fetchRevenueSeries().then(setRevenue);
    fetchCategoryBreakdown().then(setCategories);
    fetchTopTenants().then(setTopTenants);
  }, []);

  const revenueChart = revenue.map((r) => ({
    date: r.date.slice(5),
    revenue: r.revenue,
    orders: r.orders,
    reservations: r.reservations,
  }));

  const totalCat = categories.reduce((s, c) => s + c.value, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Analytics Global</h1>
        <p className="text-sm text-slate-400 mt-1">Métricas consolidadas de toda la plataforma</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Revenue total"
          value={metrics?.totalRevenue ?? 0}
          growth={metrics?.revenueGrowth ?? 0}
          prefix="S/"
          icon={<DollarSign className="h-5 w-5 text-emerald-600"/>}
          iconBg="bg-emerald-50"
          delay={0}
        />
        <MetricCard
          label="Empresas activas"
          value={metrics?.activeCompanies ?? 0}
          growth={0}
          icon={<Building2 className="h-5 w-5 text-blue-600"/>}
          iconBg="bg-blue-50"
          delay={0.07}
        />
        <MetricCard
          label="Usuarios totales"
          value={metrics?.totalUsers ?? 0}
          growth={metrics?.newUsersThisMonth ? (metrics.newUsersThisMonth / Math.max(metrics.totalUsers, 1)) * 100 : 0}
          icon={<Users className="h-5 w-5 text-violet-600"/>}
          iconBg="bg-violet-50"
          delay={0.14}
        />
        <MetricCard
          label="Transacciones"
          value={metrics?.totalTransactions ?? 0}
          growth={0}
          icon={<ShoppingBag className="h-5 w-5 text-orange-600"/>}
          iconBg="bg-orange-50"
          delay={0.21}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <h3 className="font-semibold text-ink mb-1">Revenue — últimas 4 semanas</h3>
          <p className="text-xs text-slate-400 mb-5">Ingresos consolidados en soles</p>
          <ClientOnly fallback={<div className="h-[220px]" />}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueChart} margin={{ left: -20, right: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#083d77" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#083d77" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                <Area type="monotone" dataKey="revenue" stroke="#083d77" strokeWidth={2.5} fill="url(#revGrad)"/>
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <h3 className="font-semibold text-ink mb-5">Por categoría</h3>
          <ClientOnly fallback={<div className="h-[160px]" />}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={categories} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {categories.map((e) => <Cell key={e.category} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
          <ul className="mt-4 space-y-2">
            {categories.map((c) => (
              <li key={c.category} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }}/>{c.category}</span>
                <span className="font-semibold text-ink">{Math.round((c.value / totalCat) * 100)}%</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
        className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="font-semibold text-ink">Top empresas por ingresos</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-50">
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400">Empresa</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400">Plan</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400">Revenue</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-400">Crecimiento</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-50">
            {topTenants.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">Sin datos disponibles</td>
              </tr>
            ) : (
              topTenants.map((t) => (
                <tr key={t.slug} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-ink">{t.name}</td>
                  <td className="px-6 py-4 text-slate-500">{t.plan}</td>
                  <td className="px-6 py-4 text-right font-semibold text-ink">S/{t.revenue.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${t.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {t.growth >= 0 ? <TrendingUp className="h-3 w-3"/> : <TrendingDown className="h-3 w-3"/>}
                      {t.growth}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
