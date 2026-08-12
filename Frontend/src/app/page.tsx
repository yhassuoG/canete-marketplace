import { Check, MapPin, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { BusinessSpotlight } from "@/components/home/business-spotlight";
import { CategoryGrid } from "@/components/home/category-grid";
import { DistrictsSection } from "@/components/home/districts-section";
import { Hero } from "@/components/home/hero";
import { MarketInsights } from "@/components/home/market-insights";
import { NewsEventsSection } from "@/components/home/news-events-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { adPlans } from "@/lib/data";
import { fetchDistricts, fetchEvents, fetchNews } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [districts, news, events] = await Promise.all([
    fetchDistricts(),
    fetchNews(),
    fetchEvents(),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-14 px-4 py-8 md:px-6">
        {/* Hero with premium carousel */}
        <Hero />

        {/* Distritos reales del valle */}
        <DistrictsSection districts={districts} />

        {/* Categories grid */}
        <section id="categorias" className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                <Sparkles className="h-4 w-4" />
                ¿QUÉ QUIERES HACER HOY?
              </p>
              <h2 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
                Todo lo que Cañete tiene para ofrecer
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="hidden items-center gap-1 text-sm font-semibold text-brand-800 transition hover:text-brand-600 md:inline-flex"
            >
              Ver todo →
            </Link>
          </div>
          <CategoryGrid />
        </section>

        {/* Noticias y eventos reales */}
        <NewsEventsSection news={news} events={events} />

        {/* Featured businesses (premium + destacado) */}
        <section id="destacados" className="space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
                <TrendingUp className="h-4 w-4" />
                LO MEJOR DE CAÑETE
              </p>
              <h2 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
                Negocios destacados del valle
              </h2>
              <p className="mt-2 text-slate-500">
                Restaurantes, hospedajes y experiencias mejor calificadas por la comunidad.
              </p>
            </div>
          </div>
          <BusinessSpotlight />
        </section>

        {/* Market insights chart */}
        <section id="insights">
          <MarketInsights />
        </section>

        {/* Registra tu negocio CTA */}
        <section className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 shadow-soft md:p-12">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                <MapPin className="h-4 w-4" />
                PARA NEGOCIOS
              </p>
              <h2 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
                ¿Tienes un negocio en Cañete?
              </h2>
              <p className="mt-3 max-w-md text-slate-600">
                Conecta con miles de personas que buscan descubrir, comprar y disfrutar lo mejor
                del Valle de Cañete.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Registrar mi negocio
                </Link>
                <Link
                  href="#pricing"
                  className="rounded-xl border border-brand-200 bg-white px-6 py-3 text-sm font-semibold text-brand-800 transition hover:border-brand-400"
                >
                  Ver planes
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 text-sm text-slate-600">
              {[
                "Mayor visibilidad",
                "Perfil profesional",
                "Publicación de productos",
                "Promociones",
                "Contacto por WhatsApp",
                "Estadísticas y clientes",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 rounded-xl bg-white/70 p-3">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Advertising pricing plans */}
        <section id="pricing" className="space-y-8">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
              <Megaphone className="h-4 w-4" />
              PLANES PARA NEGOCIOS
            </p>
            <h2 className="mt-3 text-3xl font-bold text-brand-900 md:text-4xl">
              Haz visible tu negocio
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-slate-500">
              Mientras más inviertas, más visible serás. Desde aparición básica en búsquedas hasta
              carrusel destacado en la página principal.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {adPlans.map((plan) => (
              <div
                key={plan.tier}
                className={`relative flex flex-col rounded-3xl border p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-lg ${
                  plan.highlighted
                    ? "border-brand-400 bg-gradient-to-b from-brand-50 to-white ring-2 ring-brand-200"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-4 py-1 text-xs font-bold text-white">
                    MÁS POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold text-brand-900">{plan.tier}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-brand-900">
                    {plan.price === 0 ? "Gratis" : `S/ ${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-slate-500">{plan.period}</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                    plan.highlighted
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-brand-900 text-white hover:bg-brand-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}

