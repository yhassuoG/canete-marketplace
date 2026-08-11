"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { demandSeries } from "@/lib/data";
import { ClientOnly } from "@/components/ui/client-only";

export function MarketInsights() {
  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Marketplace intelligence</p>
          <h2 className="mt-3 text-3xl font-semibold text-ink">Demanda semanal de reservas y delivery</h2>
        </div>
        <p className="max-w-xl text-slate-600">
          Base visual para un dashboard administrativo con forecast, top negocios, conversion y cohortes.
        </p>
      </div>
      <div className="mt-8 h-80 w-full">
        <ClientOnly fallback={<div className="h-full w-full" />}>
          <ResponsiveContainer>
            <AreaChart data={demandSeries}>
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
    </section>
  );
}
