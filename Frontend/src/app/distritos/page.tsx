import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchDistricts } from "@/lib/api";

export const metadata: Metadata = {
  title: "Distritos del Valle de Cañete — ValleCañete",
  description:
    "Explora los 16 distritos de la provincia de Cañete: Lunahuaná, Cerro Azul, Asia, Imperial y más.",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1583212292454-39d2ba9d9614?auto=format&fit=crop&w=800&q=60";

export default async function DistritosPage() {
  const districts = await fetchDistricts();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        {/* Hero */}
        <section className="rounded-3xl border border-brand-100 bg-hero-nature p-8 shadow-soft md:p-10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <MapPin className="h-4 w-4" />
            PROVINCIA DE CAÑETE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
            Distritos del Valle de Cañete
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            16 distritos llenos de historia, naturaleza, gastronomía y aventura. Desde las playas de
            Cerro Azul y Asia hasta los valles de Lunahuaná y Zúñiga.
          </p>
        </section>

        {/* Grid de distritos */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-brand-900">
            {districts.length} distritos para explorar
          </h2>

          {districts.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No se encontraron distritos.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {districts.map((d) => (
                <Link
                  key={d.slug}
                  href={`/distritos/${d.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className="h-40 w-full bg-cover bg-center bg-brand-50 transition duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${d.imageUrl || FALLBACK_IMAGE})` }}
                  />
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="text-lg font-bold text-brand-900">{d.name}</h3>
                    {d.description && (
                      <p className="line-clamp-2 text-sm text-slate-500">{d.description}</p>
                    )}
                    <p className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-semibold text-brand-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {d.placesCount} lugares registrados
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 md:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
