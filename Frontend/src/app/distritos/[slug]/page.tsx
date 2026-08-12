import { ArrowLeft, CalendarDays, MapPin, Newspaper, Store } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  fetchDistrict,
  fetchNews,
  fetchEvents,
  fetchTenants,
  type NewsApiData,
  type EventApiData,
  type TenantApiData,
} from "@/lib/api";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/canete-district/1200/800";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const district = await fetchDistrict(slug);
  if (!district) return { title: "Distrito no encontrado — ValleCañete" };
  return {
    title: `${district.name} — Distritos de Cañete`,
    description: district.description || `Explora ${district.name}, distrito del Valle de Cañete.`,
  };
}

export default async function DistritoDetailPage({ params }: Readonly<Props>) {
  const { slug } = await params;
  const district = await fetchDistrict(slug);
  if (!district) notFound();

  // Fetch related data
  const [allNews, allEvents, allTenants] = await Promise.all([
    fetchNews(),
    fetchEvents(),
    fetchTenants(),
  ]);

  const districtNews = allNews.filter((n: NewsApiData) => n.districtSlug === slug);
  const districtEvents = allEvents.filter((e: EventApiData) => e.districtSlug === slug);
  const districtTenants = allTenants.filter((t: TenantApiData) =>
    t.location?.toLowerCase().includes(district.name.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:px-6">
        <Link
          href="/distritos"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a distritos
        </Link>

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
          <div
            className="h-56 w-full bg-cover bg-center bg-brand-100 md:h-72"
            style={{ backgroundImage: `url(${district.imageUrl || FALLBACK_IMAGE})` }}
          />
          <div className="p-6 md:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
              <MapPin className="h-3.5 w-3.5" />
              {district.region}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-brand-900 md:text-4xl">{district.name}</h1>
            {district.description && (
              <p className="mt-3 max-w-3xl text-slate-600">{district.description}</p>
            )}
            <p className="mt-4 text-sm text-slate-500">
              {district.placesCount} negocios registrados en este distrito
            </p>
          </div>
        </section>

        {/* Negocios del distrito */}
        {districtTenants.length > 0 && (
          <section className="space-y-4">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-brand-900">
              <Store className="h-5 w-5" />
              Negocios en {district.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {districtTenants.map((t: TenantApiData) => (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className="h-36 w-full bg-cover bg-center bg-brand-50 transition duration-300 group-hover:scale-105"
                    style={t.bannerUrl ? { backgroundImage: `url(${t.bannerUrl})` } : undefined}
                  />
                  <div className="flex flex-1 flex-col gap-1 p-4">
                    <h3 className="font-bold text-brand-900">{t.name}</h3>
                    <p className="text-xs uppercase tracking-wider text-slate-400">{t.category}</p>
                    {t.tagline && (
                      <p className="line-clamp-2 text-sm text-slate-500">{t.tagline}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Noticias del distrito */}
        {districtNews.length > 0 && (
          <section className="space-y-4">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-brand-900">
              <Newspaper className="h-5 w-5" />
              Noticias de {district.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {districtNews.map((n: NewsApiData) => (
                <Link
                  key={n.slug}
                  href={`/noticias/${n.slug}`}
                  className="group flex gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft transition hover:shadow-card"
                >
                  <div
                    className="h-20 w-20 flex-shrink-0 rounded-xl bg-cover bg-center bg-brand-50"
                    style={n.imageUrl ? { backgroundImage: `url(${n.imageUrl})` } : undefined}
                  />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-brand-900">{n.title}</h3>
                    {n.summary && (
                      <p className="line-clamp-2 text-xs text-slate-500">{n.summary}</p>
                    )}
                    <p className="mt-auto text-xs text-slate-400">{formatDate(n.publishedAt)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Eventos del distrito */}
        {districtEvents.length > 0 && (
          <section className="space-y-4">
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-brand-900">
              <CalendarDays className="h-5 w-5" />
              Eventos en {district.name}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {districtEvents.map((e: EventApiData) => (
                <Link
                  key={e.slug}
                  href={`/eventos/${e.slug}`}
                  className="group flex gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-soft transition hover:shadow-card"
                >
                  <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <CalendarDays className="h-5 w-5" />
                    <span className="mt-0.5 text-xs font-bold">
                      {formatDate(e.eventDate).split(" ").slice(0, 2).join(" ")}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-bold text-brand-900">{e.title}</h3>
                    {e.location && (
                      <p className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {e.location}
                      </p>
                    )}
                    {e.description && (
                      <p className="line-clamp-2 text-xs text-slate-500">{e.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 md:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
