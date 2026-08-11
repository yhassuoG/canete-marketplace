"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Building2, Users, ShoppingBag } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientOnly } from "@/components/ui/client-only";

const REVENUE_12M = [
  { month: "Jun", revenue: 18200, companies: 298 },
  { month: "Jul", revenue: 21400, companies: 306 },
  { month: "Ago", revenue: 23100, companies: 312 },
  { month: "Sep", revenue: 19800, companies: 315 },
  { month: "Oct", revenue: 25600, companies: 318 },
  { month: "Nov", revenue: 28900, companies: 323 },
  { month: "Dic", revenue: 34200, companies: 328 },
  { month: "Ene", revenue: 29100, companies: 330 },
  { month: "Feb", revenue: 31400, companies: 334 },
  { month: "Mar", revenue: 35800, companies: 337 },
  { month: "Abr", revenue: 38200, companies: 340 },
  { month: "May", revenue: 42600, companies: 342 },
];

const CATEGORY_DATA = [
  { name: "Restaurantes", value: 38, color: "#0c4a6e" },
  { name: "Hoteles", value: 21, color: "#1e3a5f" },
  { name: "Experiencias", value: 24, color: "#064e3b" },
  { name: "Bodegas", value: 17, color: "#7c3aed" },
];

const TOP_TENANTS = [
  { name: "Hotel Luna", revenue: 45200, growth: 8.2, plan: "Enterprise" },
  { name: "Muelle Pacifico", revenue: 16550, growth: 11.4, plan: "Premium" },
  { name: "Paraíso Lunahuaná", revenue: 22100, growth: 14.1, plan: "Premium" },
  { name: "Viña del Sol", revenue: 8400, growth: 3.2, plan: "Starter" },
];

export default function AdminAnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Analytics Global</h1>
        <p className="text-sm text-slate-400 mt-1">Métricas consolidadas de toda la plataforma</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Revenue total" value={245600} growth={12.4} prefix="S/" icon={<DollarSign className="h-5 w-5 text-emerald-600"/>} iconBg="bg-emerald-50" delay={0}/>
        <MetricCard label="Empresas activas" value={342} growth={4.8} icon={<Building2 className="h-5 w-5 text-blue-600"/>} iconBg="bg-blue-50" delay={0.07}/>
        <MetricCard label="Usuarios totales" value={1245} growth={9.2} icon={<Users className="h-5 w-5 text-violet-600"/>} iconBg="bg-violet-50" delay={0.14}/>
        <MetricCard label="Transacciones" value={8960} growth={7.1} icon={<ShoppingBag className="h-5 w-5 text-orange-600"/>} iconBg="bg-orange-50" delay={0.21}/>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="col-span-2 rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <h3 className="font-semibold text-ink mb-1">Revenue 12 meses</h3>
          <p className="text-xs text-slate-400 mb-5">Ingresos mensuales en soles</p>
          <ClientOnly fallback={<div className="h-[220px]" />}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={REVENUE_12M} margin={{ left: -20, right: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#083d77" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#083d77" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
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
                <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {CATEGORY_DATA.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
              </PieChart>
            </ResponsiveContainer>
          </ClientOnly>
          <ul className="mt-4 space-y-2">
            {CATEGORY_DATA.map((c) => (
              <li key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: c.color }}/>{c.name}</span>
                <span className="font-semibold text-ink">{c.value}%</span>
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
            {TOP_TENANTS.map((t) => (
              <tr key={t.name} className="hover:bg-slate-50 transition-colors">
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
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
