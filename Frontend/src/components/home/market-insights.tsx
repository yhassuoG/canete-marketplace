"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { ClientOnly } from "@/components/ui/client-only";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  rating?: number;
  reviewCount?: number;
  ordersThisMonth?: number;
  reservationsThisMonth?: number;
  monthlyRevenue?: number;
}

export function MarketInsights() {
  const [tenants, setTenants] = useState<Tenant[]>([]);

  useEffect(() => {
    fetch("/api/tenants")
      .then((res) => res.json())
      .then((data: Tenant[]) => setTenants(data.filter((t) => t.status === "active")))
      .catch(() => setTenants([]));
  }, []);

  const totalOrders = tenants.reduce((sum, t) => sum + (t.ordersThisMonth ?? 0), 0);
  const totalReservations = tenants.reduce((sum, t) => sum + (t.reservationsThisMonth ?? 0), 0);
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.monthlyRevenue ?? 0), 0);
  const avgRating = tenants.length > 0
    ? (tenants.reduce((sum, t) => sum + (t.rating ?? 0), 0) / tenants.length).toFixed(1)
    : "—";

  const chartData = tenants.slice(0, 7).map((t) => ({
    name: t.name.split(" ")[0],
    bookings: t.reservationsThisMonth ?? 0,
    delivery: t.ordersThisMonth ?? 0,
  }));

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Marketplace intelligence</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Demanda semanal de reservas y delivery</h2>
        </div>
        <p className="max-w-xl text-slate-600">
          Datos en tiempo real de los {tenants.length} negocios activos en la plataforma.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Negocios activos</p>
          <p className="mt-1 text-2xl font-bold text-ink">{tenants.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Pedidos este mes</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalOrders}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Reservas este mes</p>
          <p className="mt-1 text-2xl font-bold text-ink">{totalReservations}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Rating promedio</p>
          <p className="mt-1 text-2xl font-bold text-ink">{avgRating}</p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="mt-8 h-80 w-full">
          <ClientOnly fallback={<div className="h-full w-full" />}>
            <ResponsiveContainer>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="bookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#083d77" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#083d77" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="delivery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff7a59" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ff7a59" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#083d77" fill="url(#bookings)" strokeWidth={3} />
                <Area type="monotone" dataKey="delivery" stroke="#ff7a59" fill="url(#delivery)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </ClientOnly>
        </div>
      )}
    </section>
  );
}
