"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MoreVertical, Star, ExternalLink, Plus } from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTheme } from "@/lib/themes";
import type { TenantCategory, TenantPlan, TenantStatus } from "@/lib/types";
import { fetchTenants, type TenantApiData } from "@/lib/api";

const CATEGORY_ICONS: Record<TenantCategory, string> = {
  restaurant: "🍽️",
  hotel: "🏨",
  tour: "🗺️",
  experience: "🎯",
  retail: "🛍️",
  event: "🎉",
  winery: "🍷",
  other: "🏪",
};

const CATEGORY_LABELS: Record<TenantCategory, string> = {
  restaurant: "Restaurante",
  hotel: "Hotel",
  tour: "Tour",
  experience: "Experiencia",
  retail: "Tienda",
  event: "Evento",
  winery: "Viñedo",
  other: "Otro",
};

export function CompaniesTable() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants()
      .then((data) => setTenants(data))
      .finally(() => setLoading(false));
  }, []);

  function renderBody() {
    if (loading) {
      return (
        <tr>
          <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
            Cargando empresas...
          </td>
        </tr>
      );
    }
    if (tenants.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-400">
            No hay empresas registradas.
          </td>
        </tr>
      );
    }
    return tenants.map((tenant, i) => {
      const theme = getTheme(tenant.slug);
      const category = (tenant.category || "other") as TenantCategory;
      const plan = (tenant.plan || "free") as TenantPlan;
      const status = (tenant.status || "pending") as TenantStatus;
      return (
        <motion.tr
          key={tenant.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => setSelected(selected === tenant.id ? null : tenant.id)}
          className={clsx(
            "cursor-pointer transition-colors hover:bg-slate-50",
            selected === tenant.id && "bg-blue-50/60"
          )}
        >
          {/* Company */}
          <td className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ background: theme.gradient }}
              >
                <span>{CATEGORY_ICONS[category]}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{tenant.name}</p>
                <p className="text-xs text-slate-400">{tenant.location}</p>
              </div>
            </div>
          </td>

          {/* Category */}
          <td className="px-5 py-4">
            <span className="text-sm text-slate-600">
              {CATEGORY_LABELS[category]}
            </span>
          </td>

          {/* Plan */}
          <td className="px-5 py-4">
            <StatusBadge status={plan} type="plan" />
          </td>

          {/* Status */}
          <td className="px-5 py-4">
            <StatusBadge status={status} type="status" />
          </td>

          {/* Revenue */}
          <td className="px-5 py-4">
            <span className="text-sm font-semibold text-ink">
              S/{(tenant.monthlyRevenue ?? 0).toLocaleString()}
            </span>
          </td>

          {/* Rating */}
          <td className="px-5 py-4">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-600">
              <Star className="h-3.5 w-3.5 fill-current" />
              {(tenant.rating ?? 0).toFixed(1)}
            </span>
          </td>

          {/* Actions */}
          <td className="px-5 py-4">
            <div className="flex items-center gap-2">
              <a
                href={`/${tenant.slug}`}
                target="_blank"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <Link
                href="/admin/companies"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Link>
            </div>
          </td>
        </motion.tr>
      );
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-4 sm:px-6 py-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-ink">Empresas registradas</h3>
          <p className="text-sm text-slate-500">
            {loading ? "Cargando..." : `${tenants.length} negocios`}
          </p>
        </div>
        <Link
          href="/admin/companies"
          className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-ink/90 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Gestionar
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {["Empresa", "Categoría", "Plan", "Estado", "Revenue/mes", "Rating", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {renderBody()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
