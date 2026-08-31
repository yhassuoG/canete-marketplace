"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Plus, Building2, Star, X, Trash2, Power, Pencil, Sparkles, ImagePlus, Upload } from "lucide-react";
import {
  createTenant,
  fetchTenants,
  deleteTenant,
  setTenantStatus,
  changeTenantPlan,
  setTenantFeatured,
  createUser,
  uploadTenantBanner,
  uploadTenantLogo,
  type TenantApiData,
} from "@/lib/api";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTheme } from "@/lib/themes";
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
  // ── Credenciales del owner ──
  ownerEmail: "",
  ownerPassword: "",
  ownerFullName: "",
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
    featured: tenant.featured ?? false,
  };
}

export default function AdminCompaniesPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<TenantPlan | "all">("all");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<TenantPlan>("free");
  const [editFeatured, setEditFeatured] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // Image upload state: map slug → { bannerUrl, logoUrl }
  const [tenantImages, setTenantImages] = useState<Record<string, { bannerUrl: string | null; logoUrl: string | null }>>({});
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTenants() {
      const apiTenants = await fetchTenants();
      if (!active) {
        return;
      }
      setTenants(apiTenants);
      setTenants(apiTenants.map(mapApiTenant));
      // Load banner/logo URLs from API data
      const images: Record<string, { bannerUrl: string | null; logoUrl: string | null }> = {};
      for (const t of apiTenants) {
        images[t.slug] = { bannerUrl: t.bannerUrl, logoUrl: t.logoUrl };
      }
      setTenantImages(images);
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

    // ── Crear usuario owner si se proporcionaron credenciales ──
    if (form.ownerEmail && form.ownerPassword && form.ownerFullName) {
      const tenantSlug = result.data.slug;
      const userResult = await createUser({
        email: form.ownerEmail,
        password: form.ownerPassword,
        fullName: form.ownerFullName,
        role: "business_owner",
        tenantSlug,
      });
      if (!userResult.ok) {
        setError(`Negocio creado, pero error al crear usuario: ${userResult.error}`);
        setIsSubmitting(false);
        return;
      }
    }

    setTenants((current) => [mapApiTenant(result.data as TenantApiData), ...current]);
    setForm(INITIAL_FORM);
    setShowCreateModal(false);
    setIsSubmitting(false);
  }

  async function handleDeleteTenant(slug: string, name: string) {
    if (!confirm(`¿Eliminar permanentemente "${name}"? Esta acción no se puede deshacer.`)) return;
    const result = await deleteTenant(slug);
    if (result.ok) {
      setTenants((current) => current.filter((t) => t.slug !== slug));
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  async function handleToggleStatus(slug: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const result = await setTenantStatus(slug, newStatus);
    if (result.ok) {
      setTenants((current) =>
        current.map((t) => (t.slug === slug ? { ...t, status: newStatus as Tenant["status"] } : t))
      );
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  function openEditModal(tenant: Tenant) {
    setEditingSlug(tenant.slug);
    setEditPlan(tenant.plan);
    setEditFeatured(tenant.featured ?? false);
    setEditError(null);
  }

  async function handleSaveEdit() {
    if (!editingSlug) return;
    setIsSavingEdit(true);
    setEditError(null);

    const planResult = await changeTenantPlan(editingSlug, editPlan);
    if (!planResult.ok) {
      setEditError(`Error al cambiar plan: ${planResult.error}`);
      setIsSavingEdit(false);
      return;
    }

    const featuredResult = await setTenantFeatured(editingSlug, editFeatured);
    if (!featuredResult.ok) {
      setEditError(`Error al cambiar destacado: ${featuredResult.error}`);
      setIsSavingEdit(false);
      return;
    }

    setTenants((current) =>
      current.map((t) =>
        t.slug === editingSlug ? { ...t, plan: editPlan, featured: editFeatured } : t
      )
    );
    setEditingSlug(null);
    setIsSavingEdit(false);
  }

  async function handleQuickToggleFeatured(slug: string, currentFeatured: boolean) {
    const newFeatured = !currentFeatured;
    const result = await setTenantFeatured(slug, newFeatured);
    if (result.ok) {
      setTenants((current) =>
        current.map((t) => (t.slug === slug ? { ...t, featured: newFeatured } : t))
      );
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  async function handleUploadBanner(slug: string, file: File) {
    setUploadingSlug(slug);
    setUploadError(null);
    const url = await uploadTenantBanner(slug, file);
    setUploadingSlug(null);
    if (url) {
      setTenantImages((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], bannerUrl: url },
      }));
    } else {
      setUploadError(`Error al subir el banner de ${slug}`);
    }
  }

  async function handleUploadLogo(slug: string, file: File) {
    setUploadingSlug(slug);
    setUploadError(null);
    const url = await uploadTenantLogo(slug, file);
    setUploadingSlug(null);
    if (url) {
      setTenantImages((prev) => ({
        ...prev,
        [slug]: { ...prev[slug], logoUrl: url },
      }));
    } else {
      setUploadError(`Error al subir el logo de ${slug}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between flex-wrap gap-3">
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

              {/* ── Credenciales del owner ── */}
              <div className="md:col-span-2 mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-3 text-sm font-semibold text-ink">Credenciales del administrador del negocio</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <input value={form.ownerFullName} onChange={(e) => setForm((current) => ({ ...current, ownerFullName: e.target.value }))} placeholder="Nombre completo" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                  <input type="email" value={form.ownerEmail} onChange={(e) => setForm((current) => ({ ...current, ownerEmail: e.target.value }))} placeholder="Email" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                  <input type="text" value={form.ownerPassword} onChange={(e) => setForm((current) => ({ ...current, ownerPassword: e.target.value }))} placeholder="Contraseña" className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Se creará automáticamente un usuario con rol business_owner para este negocio.</p>
              </div>

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

      {editingSlug ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-400">Editar negocio</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink">{editingSlug}</h2>
              </div>
              <button type="button" onClick={() => setEditingSlug(null)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="edit-plan-select" className="mb-2 block text-sm font-medium text-ink">Plan</label>
                <select
                  id="edit-plan-select"
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value as TenantPlan)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                <p className="mt-1 text-xs text-slate-400">Cambia el plan de suscripción del negocio.</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">Destacado en home</p>
                    <p className="text-xs text-slate-400">Mostrar este negocio en la sección destacada de la página principal.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditFeatured((v) => !v)}
                    aria-pressed={editFeatured}
                    aria-label="Toggle destacado"
                    className={`relative h-7 w-12 rounded-full transition-colors ${editFeatured ? "bg-amber-500" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${editFeatured ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>

              {editError ? <p className="text-sm text-rose-600">{editError}</p> : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingSlug(null)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600">
                  Cancelar
                </button>
                <button type="button" onClick={handleSaveEdit} disabled={isSavingEdit} className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {isSavingEdit ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {uploadError ? (
        <div className="mx-8 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {uploadError}
        </div>
      ) : null}

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-48 bg-transparent text-sm text-ink placeholder-slate-400 outline-none"
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
              {/* Banner image (or gradient fallback) with upload */}
              <div className="relative mb-4 h-28 overflow-hidden rounded-2xl">
                {tenantImages[tenant.slug]?.bannerUrl ? (
                  <img
                    src={tenantImages[tenant.slug]!.bannerUrl!}
                    alt={`Banner ${tenant.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: tenant.theme.gradient }}
                  />
                )}
                <label
                  className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur hover:bg-black/80"
                  title="Subir banner"
                >
                  {uploadingSlug === tenant.slug ? (
                    <span>Subiendo…</span>
                  ) : (
                    <>
                      <ImagePlus className="h-3 w-3" />
                      <span>Banner</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingSlug === tenant.slug}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadBanner(tenant.slug, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Name + badges */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {/* Logo (or gradient fallback) with upload */}
                  <div className="relative">
                    {tenantImages[tenant.slug]?.logoUrl ? (
                      <img
                        src={tenantImages[tenant.slug]!.logoUrl!}
                        alt={`Logo ${tenant.name}`}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: tenant.theme.gradient }}
                      >
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <label
                      className="absolute -bottom-1 -right-1 flex cursor-pointer items-center justify-center rounded-full bg-white p-0.5 shadow ring-1 ring-slate-200 hover:bg-slate-50"
                      title="Subir logo"
                    >
                      <Upload className="h-3 w-3 text-slate-500" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingSlug === tenant.slug}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUploadLogo(tenant.slug, f);
                          e.target.value = "";
                        }}
                      />
                    </label>
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
                <div className="flex items-center gap-2">
                  <StatusBadge status={tenant.plan} type="plan" />
                  {tenant.featured ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <Sparkles className="h-3 w-3" />
                      Destacado
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickToggleFeatured(tenant.slug, tenant.featured ?? false)}
                    className={`rounded-lg border p-2 hover:bg-amber-50 ${tenant.featured ? "border-amber-300 text-amber-500" : "border-slate-200 text-slate-400"}`}
                    title={tenant.featured ? "Quitar destacado" : "Destacar en home"}
                  >
                    <Sparkles className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(tenant)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    title="Editar plan y destacado"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tenant.slug, tenant.status)}
                    className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                    title={tenant.status === "active" ? "Suspender" : "Activar"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTenant(tenant.slug, tenant.name)}
                    className="rounded-lg border border-rose-200 p-2 text-rose-500 hover:bg-rose-50"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <a
                    href={`/${tenant.slug}`}
                    className="text-xs font-medium text-ocean hover:underline"
                    target="_blank"
                  >
                    Ver tienda →
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
