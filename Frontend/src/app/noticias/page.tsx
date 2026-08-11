import { Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchNews } from "@/lib/api";

export const metadata: Metadata = {
  title: "Noticias del Valle de Cañete — ValleCañete",
  description:
    "Las últimas noticias del Valle de Cañete: turismo, gastronomía, cultura y eventos de la provincia.",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=800&q=60";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function NoticiasPage() {
  const news = await fetchNews();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <section className="rounded-3xl border border-brand-100 bg-hero-nature p-8 shadow-soft md:p-10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Newspaper className="h-4 w-4" />
            NOVEDADES
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
            Noticias del Valle de Cañete
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Turismo, gastronomía, cultura y novedades de toda la provincia.
          </p>
        </section>

        <section className="space-y-6">
          {news.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No hay noticias publicadas aún.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.map((n) => (
                <Link
                  key={n.slug}
                  href={`/noticias/${n.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className="h-44 w-full bg-cover bg-center bg-brand-50 transition duration-300 group-hover:scale-105"
                    style={{ backgroundImage: `url(${n.imageUrl || FALLBACK_IMAGE})` }}
                  />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {n.category}
                    </span>
                    <h3 className="text-lg font-bold leading-snug text-brand-900">{n.title}</h3>
                    {n.summary && (
                      <p className="line-clamp-2 text-sm text-slate-500">{n.summary}</p>
                    )}
                    <p className="mt-auto pt-2 text-xs text-slate-400">
                      {formatDate(n.publishedAt)}
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
