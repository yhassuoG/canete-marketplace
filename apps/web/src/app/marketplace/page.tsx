"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Search,
  Sparkles,
  Star,
  Users,
  TrendingUp,
  Clock,
  Filter,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { categories, featuredBusinesses, type Business } from "@/lib/data";
import { ConsumerNavButton } from "@/components/consumer/consumer-nav-button";
import { fetchTenants, type TenantApiData } from "@/lib/api";

/* Map business.image key → gradient + emoji decorative header */
const businessVisuals: Record<string, { gradient: string; emoji: string }> = {
  seafood: { gradient: "from-orange-500 via-rose-500 to-red-600", emoji: "🦞" },
  adventure: { gradient: "from-emerald-500 via-teal-600 to-cyan-700", emoji: "🧭" },
  winery: { gradient: "from-rose-500 via-pink-600 to-purple-700", emoji: "🍷" },
  hotel: { gradient: "from-sky-500 via-indigo-600 to-blue-700", emoji: "🏨" },
  cafe: { gradient: "from-amber-500 via-orange-600 to-rose-600", emoji: "☕" },
  surf: { gradient: "from-cyan-500 via-blue-600 to-indigo-700", emoji: "🏄" },
};

/* Map business.image key → marketplace category title (for filtering) */
const imageToCategory: Record<string, string> = {
  seafood: "Restaurantes",
  cafe: "Restaurantes",
  adventure: "Tours",
  winery: "Vinos & Enoturismo",
  hotel: "Hoteles",
  surf: "Playa & Costa",
};

/* Map backend category → marketplace category title (for filtering) */
const backendCatToMarket: Record<string, string> = {
  restaurant: "Restaurantes",
  hotel: "Hoteles",
  tour: "Tours",
  experience: "Tours",
  winery: "Vinos & Enoturismo",
  delivery: "Delivery",
  other: "Mercado & Retail",
};

/* Gradient fallbacks por categoría backend */
const backendCatVisuals: Record<string, { gradient: string; emoji: string }> = {
  restaurant: { gradient: "from-orange-500 via-rose-500 to-red-600", emoji: "🍽️" },
  hotel: { gradient: "from-sky-500 via-indigo-600 to-blue-700", emoji: "🏨" },
  tour: { gradient: "from-emerald-500 via-teal-600 to-cyan-700", emoji: "🧭" },
  experience: { gradient: "from-emerald-500 via-teal-600 to-cyan-700", emoji: "🧭" },
  winery: { gradient: "from-rose-500 via-pink-600 to-purple-700", emoji: "🍷" },
  delivery: { gradient: "from-amber-500 via-orange-600 to-rose-600", emoji: "🛵" },
  other: { gradient: "from-violet-500 via-purple-600 to-indigo-700", emoji: "🏪" },
};

const tierBorder: Record<Business["adTier"], string> = {
  premium: "border-coral/40 ring-1 ring-coral/20",
  destacado: "border-amber-300/60 ring-1 ring-amber-200/30",
  basico: "border-slate-200",
};

const tierBadge: Record<Business["adTier"], string> = {
  premium: "bg-coral text-white",
  destacado: "bg-amber-500 text-white",
  basico: "bg-slate-100 text-slate-500",
};

const stats = [
  { label: "Negocios", value: "126+", icon: TrendingUp },
  { label: "Reservas / semana", value: "1,284", icon: Clock },
  { label: "Rating", value: "4.7★", icon: Star },
  { label: "Ciudades", value: "3", icon: MapPin },
];

/* Tipo unificado para renderizar resultados — provengan de data estática o del backend */
type ResultItem = {
  name: string;
  category: string;
  location: string;
  score: number;
  reviews: number;
  tenantSlug: string;
  gradient: string;
  emoji: string;
  adTier: Business["adTier"];
  tagline: string;
  priceFrom: number;
  badge?: string;
};

function tenantToResult(t: TenantApiData): ResultItem {
  const visuals = backendCatVisuals[t.category] ?? backendCatVisuals.other;
  let tier: Business["adTier"] = "basico";
  if (t.plan === "PREMIUM") tier = "premium";
  else if (t.plan === "PRO") tier = "destacado";
  return {
    name: t.name,
    category: backendCatToMarket[t.category] ?? "Mercado & Retail",
    location: t.location || "Cañete",
    score: t.rating || 0,
    reviews: t.reviewCount || 0,
    tenantSlug: t.slug,
    gradient: visuals.gradient,
    emoji: visuals.emoji,
    adTier: tier,
    tagline: t.tagline || t.description || "",
    priceFrom: 0,
  };
}

function featuredToResult(b: Business): ResultItem {
  const visuals = businessVisuals[b.image] ?? { gradient: "from-slate-400 to-slate-600", emoji: "🏪" };
  return {
    name: b.name,
    category: b.category,
    location: b.location,
    score: b.score,
    reviews: b.reviews,
    tenantSlug: b.tenantSlug,
    gradient: visuals.gradient,
    emoji: visuals.emoji,
    adTier: b.adTier,
    tagline: b.tagline,
    priceFrom: b.priceFrom,
    badge: b.badge,
  };
}

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTenants()
      .then((data) => {
        if (!cancelled) {
          setTenants(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Combinar resultados: tenants reales del backend + featured estáticos (sin duplicar slugs) */
  const allItems = useMemo<ResultItem[]>(() => {
    const tenantResults = tenants.map(tenantToResult);
    const tenantSlugs = new Set(tenants.map((t) => t.slug));
    const staticOnly = featuredBusinesses
      .filter((b) => !tenantSlugs.has(b.tenantSlug))
      .map(featuredToResult);
    return [...tenantResults, ...staticOnly];
  }, [tenants]);

  const filtered = allItems.filter((b) => {
    const matchesQuery =
      !query ||
      b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.category.toLowerCase().includes(query.toLowerCase()) ||
      b.location.toLowerCase().includes(query.toLowerCase()) ||
      b.tenantSlug.toLowerCase().includes(query.toLowerCase());
    const matchesCat =
      !activeCat || b.category.toLowerCase() === activeCat.toLowerCase();
    return matchesQuery && matchesCat;
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-6 md:px-6 md:py-8">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="sticky top-4 z-20 flex items-center justify-between rounded-full border border-white/70 bg-white/80 px-5 py-3.5 shadow-soft backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-orange-500 text-white">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-ink">Cañete Marketplace</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="/" className="hover:text-ink">
            Inicio
          </Link>
          <Link href="#categorias" className="hover:text-ink">
            Categorías
          </Link>
          <Link href="#negocios" className="hover:text-ink">
            Negocios
          </Link>
          <ConsumerNavButton variant="solid" />
        </nav>
      </header>

      {/* ── Hero con búsqueda ─────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/60 bg-hero-grid shadow-soft">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-ocean/20 blur-3xl" />

        <div className="relative space-y-8 p-8 md:p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-ocean/10 bg-white/80 px-4 py-2 text-sm font-medium text-ocean backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            Explora el marketplace de Cañete
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-ink md:text-5xl">
              Descubre negocios locales con{" "}
              <span className="bg-gradient-to-r from-coral to-orange-500 bg-clip-text text-transparent">
                reservas, delivery
              </span>{" "}
              y experiencias.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Restaurantes, hoteles, tours, vinos y más — todos en un solo lugar. Filtra por
              categoría, compara precios y reserva en segundos.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar restaurantes, tours, hoteles..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-base text-ink shadow-sm outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/20"
              />
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 text-base font-semibold text-white transition hover:bg-ink/90">
              <Filter className="h-5 w-5" />
              Filtros
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-3 backdrop-blur"
              >
                <s.icon className="h-5 w-5 text-coral" />
                <div>
                  <p className="text-lg font-bold text-ink">{s.value}</p>
                  <p className="text-xs text-slate-500">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Categorías ────────────────────────────────── */}
      <section id="categorias" className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              Categorías
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">Explora por categoría</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((cat, i) => (
            <motion.button
              key={cat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onClick={() => setActiveCat(activeCat === cat.title ? null : cat.title)}
              className={`group relative overflow-hidden rounded-3xl border p-5 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-lg ${
                activeCat === cat.title
                  ? "border-coral bg-white ring-2 ring-coral/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-2xl shadow-md`}
              >
                {cat.emoji}
              </div>
              <h3 className="text-lg font-bold text-ink">{cat.title}</h3>
              <p className="mt-1 text-sm leading-5 text-slate-500">{cat.description}</p>
              <p className="mt-3 text-xs font-semibold text-coral">{cat.metric}</p>
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Negocios destacados ───────────────────────── */}
      <section id="negocios" className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              {activeCat ? `Filtrado: ${activeCat}` : "Negocios destacados"}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink">
              {filtered.length} {filtered.length === 1 ? "negocio" : "negocios"} disponibles
            </h2>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-lg text-slate-500">
              {loading
                ? "Cargando negocios..."
                : "No se encontraron negocios. Prueba con otra categoría o búsqueda."}
            </p>
            {!loading && (
              <button
                onClick={() => {
                  setQuery("");
                  setActiveCat(null);
                }}
                className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((b, i) => (
              <motion.article
                key={b.tenantSlug}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lg ${tierBorder[b.adTier]}`}
              >
                {/* Visual header — gradient + emoji */}
                <div
                  className={`relative h-48 overflow-hidden bg-gradient-to-br ${b.gradient}`}
                >
                  {/* Decorative dot pattern */}
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                  {/* Large emoji */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-7xl opacity-90 transition duration-500 group-hover:scale-125">
                      {b.emoji}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                  {b.badge && (
                    <div
                      className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${tierBadge[b.adTier]}`}
                    >
                      {b.badge}
                    </div>
                  )}
                  <button className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white">
                    <Heart className="h-4 w-4 text-slate-400 transition hover:fill-coral hover:text-coral" />
                  </button>
                  <div className="absolute right-3 top-12 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-sm font-bold text-ink shadow-sm">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {b.score}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-xs font-medium uppercase tracking-widest text-white/80">
                      {b.category}
                    </p>
                    <h3 className="mt-0.5 text-xl font-bold text-white">{b.name}</h3>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <p className="text-sm text-slate-600">{b.tagline}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {b.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {b.reviews.toLocaleString()}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-xs text-slate-400">Desde</p>
                      <p className="text-lg font-bold text-ink">S/ {b.priceFrom}</p>
                    </div>
                    <Link
                      href={`/${b.tenantSlug}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
                    >
                      Ver negocio
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA inferior ──────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-ocean to-ink p-8 text-center text-white md:p-12">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold md:text-4xl">¿Tienes un negocio en Cañete?</h2>
          <p className="mx-auto max-w-xl text-lg text-white/80">
            Únete al marketplace y llega a miles de clientes. Reservas, delivery, catálogo y
            promociones — todo en una plataforma.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-coral/90"
          >
            Publicar mi negocio
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
