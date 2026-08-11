import { ArrowLeft, CalendarDays, Clock, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchEventBySlug } from "@/lib/api";

interface PageProps {
  readonly params: Promise<{ slug: string }>;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event) return { title: "Evento no encontrado — ValleCañete" };
  return {
    title: `${event.title} — Eventos ValleCañete`,
    description: event.description || event.title,
  };
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=70";

export default async function EventoDetailPage({ params }: Readonly<PageProps>) {
  const { slug } = await params;
  const event = await fetchEventBySlug(slug);
  if (!event) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
        <Link
          href="/eventos"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a eventos
        </Link>

        <article className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
          <div
            className="h-56 w-full bg-cover bg-center bg-brand-100 md:h-80"
            style={{ backgroundImage: `url(${event.imageUrl || FALLBACK_IMAGE})` }}
          />
          <div className="space-y-5 p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <CalendarDays className="h-3.5 w-3.5" />
                {event.category}
              </span>
              {event.featured && (
                <span className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white">
                  Destacado
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight text-brand-900 md:text-4xl">
              {event.title}
            </h1>

            <div className="flex flex-wrap gap-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-brand-600" />
                {formatDate(event.eventDate)}
              </span>
              {(event.startTime || event.endTime) && (
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  {event.startTime}
                  {event.endTime && ` — ${event.endTime}`}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  {event.location}
                </span>
              )}
            </div>

            {event.description && (
              <div className="prose prose-slate max-w-none">
                <p>{event.description}</p>
              </div>
            )}
          </div>
        </article>
      </main>
      <div className="mx-auto w-full max-w-4xl px-4 pb-8 md:px-6">
        <SiteFooter />
      </div>
    </div>
  );
}
