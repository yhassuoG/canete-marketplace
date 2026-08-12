import { CalendarDays, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchEvents } from "@/lib/api";

export const metadata: Metadata = {
  title: "Eventos y Festividades — ValleCañete",
  description:
    "Eventos, fiestas patronales, festivales gastronómicos y actividades culturales en el Valle de Cañete.",
};

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/canete-event/800/600";

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

function formatShortDate(value: string) {
  try {
    const d = new Date(value);
    const day = d.getDate().toString().padStart(2, "0");
    const month = new Intl.DateTimeFormat("es-PE", { month: "short" }).format(d).toUpperCase();
    return { day, month };
  } catch {
    return { day: "??", month: "???" };
  }
}

export default async function EventosPage() {
  const events = await fetchEvents();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <section className="rounded-3xl border border-brand-100 bg-hero-nature p-8 shadow-soft md:p-10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <CalendarDays className="h-4 w-4" />
            AGENDA CAÑETANA
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
            Eventos y Festividades
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Fiestas patronales, festivales gastronómicos, ferias artesanales y actividades
            culturales en toda la provincia de Cañete.
          </p>
        </section>

        <section className="space-y-6">
          {events.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No hay eventos programados por el momento.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => {
                const { day, month } = formatShortDate(ev.eventDate);
                return (
                  <Link
                    key={ev.slug}
                    href={`/eventos/${ev.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <div className="relative">
                      <div
                        className="h-44 w-full bg-cover bg-center bg-brand-50 transition duration-300 group-hover:scale-105"
                        style={{ backgroundImage: `url(${ev.imageUrl || FALLBACK_IMAGE})` }}
                      />
                      <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white/95 shadow-sm backdrop-blur">
                        <span className="text-lg font-bold leading-none text-brand-800">{day}</span>
                        <span className="text-[10px] font-semibold uppercase text-brand-600">
                          {month}
                        </span>
                      </div>
                      {ev.featured && (
                        <span className="absolute right-3 top-3 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                          Destacado
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                        {ev.category}
                      </span>
                      <h3 className="text-lg font-bold leading-snug text-brand-900">{ev.title}</h3>
                      {ev.location && (
                        <p className="inline-flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="h-4 w-4" />
                          {ev.location}
                        </p>
                      )}
                      <p className="mt-auto pt-2 text-xs text-slate-400">
                        {formatDate(ev.eventDate)}
                        {ev.startTime && ` — ${ev.startTime}`}
                        {ev.endTime && ` a ${ev.endTime}`}
                      </p>
                    </div>
                  </Link>
                );
              })}
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
