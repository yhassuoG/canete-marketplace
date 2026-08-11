"use client";

import {
  ArrowRight,
  ChevronRight,
  Heart,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchTenants, fetchEvents, type TenantApiData, type EventApiData } from "@/lib/api";

/* Categorías para los pills de filtro */
const CATEGORY_PILLS = [
  { label: "Todas las categorías", value: null },
  { label: "Restaurantes", value: "restaurant" },
  { label: "Hospedajes", value: "hotel" },
  { label: "Tours", value: "tour" },
  { label: "Experiencias", value: "experience" },
  { label: "Vinos", value: "winery" },
  { label: "Otros", value: "other" },
];

/* Label legible por categoría backend */
const categoryLabel: Record<string, string> = {
  restaurant: "Restaurante",
  hotel: "Hospedaje",
  tour: "Tour",
  experience: "Experiencia",
  winery: "Viñedo",
  other: "Negocio",
};

function formatEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return { day: d.getDate().toString().padStart(2, "0"), month: d.toLocaleDateString("es-PE", { month: "short" }).toUpperCase() };
  } catch {
    return { day: "--", month: "---" };
  }
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [events, setEvents] = useState<EventApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchTenants(), fetchEvents()])
      .then(([t, e]) => {
        if (!cancelled) {
          setTenants(t);
          setEvents(e);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      const matchesQuery =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.location?.toLowerCase().includes(query.toLowerCase()) ||
        t.tagline?.toLowerCase().includes(query.toLowerCase()) ||
        t.category?.toLowerCase().includes(query.toLowerCase());
      const matchesCat = !activeCat || t.category === activeCat;
      return matchesQuery && matchesCat;
    });
  }, [tenants, query, activeCat]);

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-700 transition">Inicio</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-brand-800">Marketplace</span>
        </nav>

        {/* Título */}
        <div>
          <h1 className="text-3xl font-bold text-brand-900 md:text-4xl">Marketplace</h1>
          <p className="mt-2 text-lg text-slate-600">
            Productos frescos, artesanía, gastronomía y más en todo el Valle de Cañete.
          </p>
        </div>

        {/* Barra de búsqueda + filtro */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar negocios, productos, experiencias..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm text-brand-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtrar
          </button>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => setActiveCat(pill.value)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCat === pill.value
                  ? "bg-brand-700 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Grid de negocios */}
        {loading ? (
          <div className="py-16 text-center text-slate-500">Cargando negocios...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg text-slate-500">
              No se encontraron negocios. Prueba con otra categoría o búsqueda.
            </p>
            <button
              type="button"
              onClick={() => { setQuery(""); setActiveCat(null); }}
              className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => (
              <Link
                key={t.slug}
                href={`/${t.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden bg-brand-50">
                  {t.bannerUrl ? (
                    <img
                      src={t.bannerUrl}
                      alt={t.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : t.logoUrl ? (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                      <img src={t.logoUrl} alt={t.name} className="h-20 w-20 rounded-xl object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
                      <Store className="h-12 w-12 text-brand-300" />
                    </div>
                  )}
                  {/* Heart */}
                  <button
                    type="button"
                    onClick={(e) => e.preventDefault()}
                    className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5 shadow-sm transition hover:bg-white"
                  >
                    <Heart className="h-4 w-4 text-slate-400" />
                  </button>
                  {/* Category label */}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-brand-700 shadow-sm">
                    {categoryLabel[t.category] ?? t.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <h3 className="font-bold text-brand-900 group-hover:text-brand-700 transition">{t.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {t.location || "Cañete"}
                    </span>
                    {t.rating > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {t.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                  {t.tagline && (
                    <p className="line-clamp-2 text-sm text-slate-500">{t.tagline}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA — ¿Tienes un producto local? */}
        <section className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-700 to-brand-800 px-8 py-8 text-white sm:flex-row md:px-12">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">¿Tienes un producto local?</h2>
            <p className="mt-1 text-sm text-white/80">
              Registra tu negocio en nuestro marketplace y llega a más clientes.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
          >
            Publicar producto
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* Eventos y festividades */}
        {events.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-900">Eventos y festividades</h2>
                <p className="mt-1 text-sm text-slate-500">Próximos eventos en el Valle de Cañete</p>
              </div>
              <Link href="/eventos" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-900 transition">
                Ver calendario completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((ev) => {
                const { day, month } = formatEventDate(ev.eventDate ?? "");
                return (
                  <Link
                    key={ev.slug}
                    href={`/eventos/${ev.slug}`}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <span className="text-xl font-bold leading-none">{day}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider">{month}</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-brand-900 group-hover:text-brand-700 transition">{ev.title}</h3>
                      {ev.location && (
                        <p className="mt-0.5 truncate text-xs text-slate-500">{ev.location}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
