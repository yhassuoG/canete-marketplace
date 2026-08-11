"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Search, Sparkles, Star, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { heroSlides } from "@/lib/data";
import { useMarketplaceStore } from "@/lib/store";

const stats = [
  { label: "Negocios activos", value: "126", suffix: "+" },
  { label: "Reservas / semana", value: "1,284", suffix: "" },
  { label: "Rating promedio", value: "4.7", suffix: "★" },
  { label: "Ciudades", value: "3", suffix: "" },
];

export function Hero() {
  const mode = useMarketplaceStore((state) => state.mode);
  const setMode = useMarketplaceStore((state) => state.setMode);
  const [slide, setSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  };

  const current = heroSlides[slide];

  return (
    <section className="relative overflow-hidden rounded-[2.5rem] border border-brand-100 bg-hero-nature shadow-soft">
      {/* Decorative gradient blobs */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-brand-700/15 blur-3xl" />

      <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        {/* Left: search + headline */}
        <div className="space-y-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-2 text-sm font-medium text-brand-700 backdrop-blur"
          >
            <Sparkles className="h-4 w-4" />
            El portal oficial del Valle de Cañete
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-brand-900 md:text-6xl">
              Descubre el{" "}
              <span className="bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                Valle de Cañete
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-7 text-slate-600">
              Naturaleza, historia, gastronomía, aventura y experiencias inolvidables a solo unas
              horas de Lima.
            </p>
          </motion.div>

          {/* Search bar e-commerce */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col gap-3 rounded-3xl border border-white/70 bg-white/85 p-3 shadow-soft backdrop-blur sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <Search className="h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-slate-400"
                placeholder="¿Qué estás buscando?"
              />
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <MapPin className="h-5 w-5 text-slate-400" />
              <input
                className="w-full bg-transparent text-sm text-brand-900 outline-none placeholder:text-slate-400 sm:w-32"
                placeholder="Cañete"
              />
            </div>
            <button
              type="submit"
              className="rounded-2xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 hover:shadow-lg"
            >
              Buscar
            </button>
          </motion.form>

          {/* Quick category pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            {[
              { label: "🍽️ Restaurantes", v: "eat" },
              { label: "🏨 Hospedajes", v: "stay" },
              { label: "🧭 Tours", v: "tour" },
              { label: "🛍️ Marketplace", v: "delivery" },
            ].map((t) => (
              <button
                key={t.v}
                type="button"
                onClick={() => setMode(t.v as typeof mode)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  mode === t.v
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 gap-4 sm:grid-cols-4"
          >
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-brand-900 md:text-3xl">
                  {s.value}
                  <span className="text-brand-600">{s.suffix}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right: featured carousel (premium ads) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
            <TrendingUp className="h-3 w-3" />
            NEGOCIOS DESTACADOS
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.tenantSlug}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5 }}
              className="overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-soft"
            >
              {/* Image area with gradient */}
              <div className={`relative h-56 bg-gradient-to-br ${current.accent} md:h-64`}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  DESTACADO
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <p className="text-xs uppercase tracking-widest opacity-80">{current.category}</p>
                    <h3 className="mt-1 text-2xl font-bold">{current.name}</h3>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-brand-900">
                    <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                    {current.score}
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="space-y-4 p-5">
                <p className="text-sm text-slate-600">{current.tagline}</p>
                <div className="flex items-center justify-between">
                  <p className="inline-flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {current.location}
                  </p>
                  <p className="text-sm text-slate-500">
                    <span className="font-bold text-brand-900">S/ {current.priceFrom}</span> desde
                  </p>
                </div>
                <Link
                  href={`/marketplace`}
                  className="block rounded-2xl bg-brand-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-900"
                >
                  Ver negocio →
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Carousel controls */}
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setSlide((s) => (s - 1 + heroSlides.length) % heroSlides.length)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex gap-1.5">
              {heroSlides.map((h, i) => (
                <button
                  key={h.tenantSlug}
                  type="button"
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === slide ? "w-6 bg-brand-600" : "w-2 bg-slate-300"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSlide((s) => (s + 1) % heroSlides.length)}
              className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
