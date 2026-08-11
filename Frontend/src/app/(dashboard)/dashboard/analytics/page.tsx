"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MetricCard } from "@/components/ui/metric-card";
import { ClientOnly } from "@/components/ui/client-only";
import { TrendingUp, DollarSign, Users, ShoppingBag, Star, Calendar } from "lucide-react";

const MONTHLY = [
  { month: "Dic", sales: 9800, customers: 180, reservations: 28 },
  { month: "Ene", sales: 11200, customers: 198, reservations: 32 },
  { month: "Feb", sales: 10400, customers: 192, reservations: 29 },
  { month: "Mar", sales: 13100, customers: 210, reservations: 38 },
  { month: "Abr", sales: 14800, customers: 224, reservations: 41 },
  { month: "May", sales: 16550, customers: 256, reservations: 32 },
];

const WEEKLY = [
  { day: "Lun", sales: 1420, orders: 23 },
  { day: "Mar", sales: 1850, orders: 31 },
  { day: "Mié", sales: 1640, orders: 28 },
  { day: "Jue", sales: 2100, orders: 38 },
  { day: "Vie", sales: 2890, orders: 52 },
  { day: "Sáb", sales: 3450, orders: 64 },
  { day: "Dom", sales: 3200, orders: 59 },
];

const PEAK_HOURS = [
  { hour: "08h", pax: 5 }, { hour: "09h", pax: 8 }, { hour: "10h", pax: 12 },
  { hour: "11h", pax: 28 }, { hour: "12h", pax: 64 }, { hour: "13h", pax: 82 },
  { hour: "14h", pax: 70 }, { hour: "15h", pax: 45 }, { hour: "16h", pax: 20 },
  { hour: "17h", pax: 18 }, { hour: "18h", pax: 38 }, { hour: "19h", pax: 72 },
  { hour: "20h", pax: 91 }, { hour: "21h", pax: 85 }, { hour: "22h", pax: 40 },
];

export default function DashboardAnalyticsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Analytics</h1><p className="text-sm text-slate-400">Rendimiento detallado del negocio</p></div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Ventas totales" value={16550} growth={11.4} prefix="S/" icon={<DollarSign className="h-5 w-5 text-emerald-600"/>} iconBg="bg-emerald-50" delay={0}/>
          <MetricCard label="Clientes únicos" value={256} growth={9.2} icon={<Users className="h-5 w-5 text-blue-600"/>} iconBg="bg-blue-50" delay={0.07}/>
          <MetricCard label="Ticket promedio" value={64.6} growth={2.1} prefix="S/" decimals={1} icon={<ShoppingBag className="h-5 w-5 text-violet-600"/>} iconBg="bg-violet-50" delay={0.14}/>
          <MetricCard label="Rating promedio" value={4.9} growth={0.2} decimals={1} icon={<Star className="h-5 w-5 text-amber-500"/>} iconBg="bg-amber-50" delay={0.21}/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <h3 className="font-semibold text-ink mb-1">Tendencia mensual (6 meses)</h3>
            <p className="text-xs text-slate-400 mb-5">Ventas y clientes mes a mes</p>
            <ClientOnly fallback={<div className="h-[200px]" />}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={MONTHLY} margin={{ left: -20, right: 0 }}>
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
                <BarChart data={WEEKLY} margin={{ left: -20, right: 0 }}>
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
              <BarChart data={PEAK_HOURS} margin={{ left: -20, right: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }}/>
                <Bar dataKey="pax" name="Comensales" fill="#0369a1" radius={[4, 4, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </ClientOnly>
          <div className="mt-4 flex gap-6 text-sm">
            <div className="flex items-center gap-2 text-slate-500"><div className="h-3 w-3 rounded bg-[#0369a1]"/> Hora más concurrida: <strong className="text-ink">20h (91 pax)</strong></div>
            <div className="flex items-center gap-2 text-slate-500"><TrendingUp className="h-4 w-4 text-emerald-500"/> 2 picos: mediodía y noche</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
