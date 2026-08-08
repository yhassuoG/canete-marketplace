"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Building2, Star, X } from "lucide-react";
import { createTenant, fetchTenants, type TenantApiData } from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTheme, TENANTS } from "@/lib/themes";
import type { Tenant, TenantPlan } from "@/lib/types";

const PLAN_FILTER_OPTIONS: Array<TenantPlan | "all"> = ["all", "free", "starter", "premium", "enterprise"];

const INITIAL_FORM = {
  name: "",
  slug: "",
  category: "restaurant",
  location: "",
  tagline: "",
  description: "",
  phone: "",
  address: "",
  lat: "",
  lng: "",
  primaryColor: "#0c4a6e",
};

function mapApiTenant(tenant: TenantApiData): Tenant {
  return {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    tagline: tenant.tagline,
    category: tenant.category as Tenant["category"],
    location: tenant.location,
    plan: tenant.plan as TenantPlan,
    status: tenant.status as Tenant["status"],
    rating: tenant.rating,
    reviewCount: tenant.reviewCount,
    monthlyRevenue: tenant.monthlyRevenue,
    reservationsThisMonth: tenant.reservationsThisMonth,
    ordersThisMonth: tenant.ordersThisMonth,
    description: tenant.description,
    theme: getTheme(tenant.slug),
    createdAt: new Date().toISOString(),
    owner: "Pendiente",
    phone: tenant.phone,
    features: tenant.features as Tenant["features"],
    lat: tenant.lat,
    lng: tenant.lng,
    address: tenant.address,
  };
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<TenantPlan | "all">("all");
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      const apiTenants = await fetchTenants();
      if (!active || apiTenants.length === 0) {
        return;
      }
      setTenants(apiTenants.map(mapApiTenant));
    }

    void loadTenants();

    return () => {
      active = false;
    };
  }, []);

  const filtered = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || t.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await createTenant(form);

    if (result.conflict) {
      setError(result.message ?? "El slug del negocio ya existe. Usa otro nombre o slug.");
      setIsSubmitting(false);
      return;
    }

    if (!result.data) {
      setError(result.message ?? "No se pudo crear el negocio. Verifica que la API esté disponible.");
      setIsSubmitting(false);
      return;
    }

    setTenants((current) => [mapApiTenant(result.data as TenantApiData), ...current]);
    setForm(INITIAL_FORM);
    setShowCreateModal(false);
    setIsSubmitting(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Gestión de Empresas</h1>
            <p className="text-sm text-slate-400">{tenants.length} negocios registrados en la plataforma</p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo negocio
          </button>
        </div>
      </header>

      {showCreateModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Onboarding</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">Agregar nuevo negocio</h2>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Nombre del negocio" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
              <input value={form.slug} onChange={(e) => setForm((current) => ({ ...current, slug: e.target.value.toLowerCase() }))} placeholder="Slug opcional" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <select value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" >
                <option value="restaurant">Restaurante</option>
                <option value="hotel">Hotel</option>
                <option value="experience">Experiencia</option>
                <option value="winery">Viñedo</option>
                <option value="other">Otro</option>
              </select>
              <input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="Ubicación" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
              <input value={form.tagline} onChange={(e) => setForm((current) => ({ ...current, tagline: e.target.value }))} placeholder="Tagline" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none md:col-span-2" />
              <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Descripción" className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none md:col-span-2" />
              <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="Teléfono" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <input value={form.primaryColor} onChange={(e) => setForm((current) => ({ ...current, primaryColor: e.target.value }))} placeholder="Color primario" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} placeholder="Dirección" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none md:col-span-2" />
              <input value={form.lat} onChange={(e) => setForm((current) => ({ ...current, lat: e.target.value }))} placeholder="Latitud" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <input value={form.lng} onChange={(e) => setForm((current) => ({ ...current, lng: e.target.value }))} placeholder="Longitud" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />

              {error ? <p className="text-sm text-rose-600 md:col-span-2">{error}</p> : null}

              <div className="flex justify-end gap-3 md:col-span-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {isSubmitting ? "Guardando..." : "Crear negocio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent text-sm text-ink placeholder-slate-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as TenantPlan | "all")}
              className="bg-transparent text-sm text-ink outline-none cursor-pointer"
            >
              {PLAN_FILTER_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p === "all" ? "Todos los planes" : p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tenant, i) => (
            <motion.div
              key={tenant.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group cursor-pointer rounded-3xl border border-slate-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-card-hover"
            >
              {/* Hero bar */}
              <div
                className="mb-5 h-2 rounded-full"
                style={{ background: tenant.theme.gradient }}
              />

              {/* Name + badges */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                    style={{ background: tenant.theme.gradient }}
                  >
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">{tenant.name}</h2>
                    <p className="text-xs text-slate-400">{tenant.location}</p>
                  </div>
                </div>
                <StatusBadge status={tenant.status} />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-base font-bold text-ink">
                    S/{(tenant.monthlyRevenue / 1000).toFixed(1)}K
                  </p>
                  <p className="text-[10px] text-slate-400">Revenue</p>
                </div>
                <div>
                  <p className="text-base font-bold text-ink">{tenant.reservationsThisMonth}</p>
                  <p className="text-[10px] text-slate-400">Reservas</p>
                </div>
                <div>
                  <p className="text-base font-bold text-ink flex items-center justify-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {tenant.rating}
                  </p>
                  <p className="text-[10px] text-slate-400">Rating</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <StatusBadge status={tenant.plan} type="plan" />
                <a
                  href={`/${tenant.slug}`}
                  className="text-xs font-medium text-ocean hover:underline"
                  target="_blank"
                >
                  Ver tienda →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
