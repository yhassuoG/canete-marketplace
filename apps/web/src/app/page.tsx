import { Check, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { BusinessSpotlight } from "@/components/home/business-spotlight";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { MarketInsights } from "@/components/home/market-insights";
import { ConsumerNavButton } from "@/components/consumer/consumer-nav-button";
import { adPlans } from "@/lib/data";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-4 py-6 md:px-6 md:py-8">
      {/* Sticky nav header */}
      <header className="sticky top-4 z-20 flex items-center justify-between rounded-2xl border border-white/70 bg-white/80 px-5 py-3 shadow-soft backdrop-blur">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-orange-500 text-lg font-bold text-white">
            C
          </span>
          <span className="text-lg font-bold text-ink">Cañete Market</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="#categorias" className="transition hover:text-ink">
            Categorías
          </Link>
          <Link href="#destacados" className="transition hover:text-ink">
            Destacados
          </Link>
          <Link href="#negocios" className="transition hover:text-ink">
            Negocios
          </Link>
          <Link href="#pricing" className="transition hover:text-ink">
            Anúnciate
          </Link>
          <Link href="#insights" className="transition hover:text-ink">
            Insights
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ConsumerNavButton variant="ghost" />
          </div>
          <Link
            href="/marketplace"
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Explorar
          </Link>
        </div>
      </header>

      {/* Hero with premium carousel */}
      <Hero />

      {/* Categories grid */}
      <section id="categorias" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-coral">
              <Sparkles className="h-4 w-4" />
              EXPLORA POR CATEGORÍA
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink md:text-4xl">
              Todo lo que Cañete tiene para ofrecer
            </h2>
          </div>
          <Link
            href="/marketplace"
            className="hidden items-center gap-1 text-sm font-semibold text-ink transition hover:text-coral md:inline-flex"
          >
            Ver todo →
          </Link>
        </div>
        <CategoryGrid />
      </section>

      {/* Featured businesses (premium + destacado) */}
      <section id="destacados" className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-coral">
              <TrendingUp className="h-4 w-4" />
              NEGOCIOS DESTACADOS
            </p>
            <h2 className="mt-2 text-3xl font-bold text-ink md:text-4xl">
              Los mejores negocios, al frente de la plataforma
            </h2>
            <p className="mt-2 text-slate-500">
              Negocios con planes Premium y Destacado — mayor visibilidad, más reservas.
            </p>
          </div>
        </div>
        <BusinessSpotlight />
      </section>

      {/* Market insights chart */}
      <section id="insights">
        <MarketInsights />
      </section>

      {/* Advertising pricing plans */}
      <section id="pricing" className="space-y-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-coral">
            <Megaphone className="h-4 w-4" />
            ANÚNCIATE EN CAÑETE MARKET
          </p>
          <h2 className="mt-3 text-3xl font-bold text-ink md:text-4xl">
            Haz visible tu negocio
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-500">
            Mientras más inviertas, más visible serás. Desde aparición básica en búsquedas hasta
            carrusel hero en la página principal.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {adPlans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative flex flex-col rounded-3xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lg ${
                plan.highlighted
                  ? "border-coral bg-gradient-to-b from-coral/5 to-white ring-2 ring-coral/30"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-coral px-4 py-1 text-xs font-bold text-white">
                  MÁS POPULAR
                </div>
              )}
              <h3 className="text-xl font-bold text-ink">{plan.tier}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink">
                  {plan.price === 0 ? "Gratis" : `S/ ${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-slate-500">{plan.period}</span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-6 rounded-xl py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-coral text-white hover:bg-coral/90"
                    : "bg-ink text-white hover:bg-ink/90"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="overflow-hidden rounded-3xl bg-ink p-8 text-white md:p-12">
        <div className="grid gap-6 md:grid-cols-[1.5fr_0.5fr] md:items-center">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">
              ¿Listo para llevar tu negocio al siguiente nivel?
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Únete a más de 126 negocios que ya están creciendo con Cañete Market. Reservas,
              delivery, analytics y visibilidad publicitaria en una sola plataforma.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/marketplace"
              className="rounded-xl bg-coral px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-coral/90"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/20 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-sm text-white/50">
          © 2025 Cañete Market — Plataforma publicitaria multiempresa para Cañete
        </div>
      </footer>
    </main>
  );
}
