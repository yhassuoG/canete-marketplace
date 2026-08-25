"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientOnly } from "@/components/ui/client-only";
import { TrendingUp, DollarSign, Users, ShoppingBag, Star } from "lucide-react";
import {
  fetchBusinessAnalytics,
  fetchTenantMonthlySeries,
  fetchTenantWeeklySeries,
  fetchTenantPeakHours,
  type BusinessAnalytics,
  type TenantMonthlyEntry,
  type TenantWeeklyEntry,
  type TenantPeakHourEntry,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

export default function DashboardAnalyticsPage() {
  const [biz, setBiz] = useState<BusinessAnalytics | null>(null);
  const [monthly, setMonthly] = useState<TenantMonthlyEntry[]>([]);
  const [weekly, setWeekly] = useState<TenantWeeklyEntry[]>([]);
  const [peakHours, setPeakHours] = useState<TenantPeakHourEntry[]>([]);

  useEffect(() => {
    const user = getAuthUser();
    const slug = user?.tenantSlug;
    if (!slug) return;

    fetchBusinessAnalytics(slug).then(setBiz);
    fetchTenantMonthlySeries(slug).then(setMonthly);
    fetchTenantWeeklySeries(slug).then(setWeekly);
    fetchTenantPeakHours(slug).then(setPeakHours);
  }, []);

  const peakMax = peakHours.length > 0
    ? peakHours.reduce((max, h) => h.pax > max.pax ? h : max, peakHours[0])
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Analytics</h1><p className="text-sm text-slate-400">Rendimiento detallado del negocio</p></div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Ventas totales" value={biz?.totalSales ?? 0} growth={biz?.salesGrowth ?? 0} prefix="S/" icon={<DollarSign className="h-5 w-5 text-emerald-600"/>} iconBg="bg-emerald-50" delay={0}/>
          <MetricCard label="Clientes únicos" value={biz?.totalCustomers ?? 0} growth={biz?.customerGrowth ?? 0} icon={<Users className="h-5 w-5 text-blue-600"/>} iconBg="bg-blue-50" delay={0.07}/>
          <MetricCard label="Ticket promedio" value={biz && biz.totalOrders > 0 ? biz.totalSales / biz.totalOrders : 0} growth={biz?.orderGrowth ?? 0} prefix="S/" decimals={1} icon={<ShoppingBag className="h-5 w-5 text-violet-600"/>} iconBg="bg-violet-50" delay={0.14}/>
          <MetricCard label="Rating promedio" value={biz?.avgRating ?? 0} growth={0} decimals={1} icon={<Star className="h-5 w-5 text-amber-500"/>} iconBg="bg-amber-50" delay={0.21}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <h3 className="font-semibold text-ink mb-1">Tendencia mensual (6 meses)</h3>
            <p className="text-xs text-slate-400 mb-5">Ventas y clientes mes a mes</p>
            <ClientOnly fallback={<div className="h-[200px]" />}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthly} margin={{ left: -20, right: 0 }}>
                  <defs>
                    <linearGradient id="mGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0c4a6e" stopOpacity={0.2}/><stop offset="95%" stopColor="#0c4a6e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                  <Area type="monotone" dataKey="sales" name="Ventas S/" stroke="#0c4a6e" strokeWidth={2.5} fill="url(#mGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </ClientOnly>
          </motion.div>

          {/* Weekly */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <h3 className="font-semibold text-ink mb-1">Ventas esta semana</h3>
            <p className="text-xs text-slate-400 mb-5">Desglose diario en soles</p>
            <ClientOnly fallback={<div className="h-[200px]" />}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weekly} margin={{ left: -20, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                  <Bar dataKey="sales" name="Ventas S/" fill="#0c4a6e" radius={[6, 6, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </ClientOnly>
          </motion.div>
        </div>

        {/* Peak hours */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <h3 className="font-semibold text-ink mb-1">Horas pico</h3>
          <p className="text-xs text-slate-400 mb-5">Número de comensales por hora del día (promedio semanal)</p>
          <ClientOnly fallback={<div className="h-[160px]" />}>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={peakHours} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                <Bar dataKey="pax" name="Comensales" fill="#0369a1" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-500"><div className="h-3 w-3 rounded bg-[#0369a1]"/> Hora más concurrida: <strong className="text-ink">{peakMax ? `${peakMax.hour} (${peakMax.pax} pedidos)` : "—"}</strong></div>
            <div className="flex items-center gap-2 text-slate-500"><TrendingUp className="h-4 w-4 text-emerald-500"/> Basado en historial de pedidos</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
