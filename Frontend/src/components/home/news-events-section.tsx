"use client";

import { CalendarDays, Newspaper } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { EventApiData, NewsApiData } from "@/lib/api";

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/canete-news/800/600";

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export function NewsEventsSection({
  news,
  events,
}: Readonly<{ news: NewsApiData[]; events: EventApiData[] }>) {
  const [tab, setTab] = useState<"noticias" | "eventos">("noticias");

  if (news.length === 0 && events.length === 0) return null;

  const items = tab === "noticias" ? news : events;

  return (
    <section id="noticias-eventos" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
            <Newspaper className="h-4 w-4" />
            LO ÚLTIMO EN CAÑETE
          </p>
          <h2 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
            Noticias y eventos
          </h2>
        </div>
        <div className="inline-flex rounded-xl border border-brand-100 bg-white p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setTab("noticias")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "noticias" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-brand-700"
            }`}
          >
            Noticias
          </button>
          <button
            type="button"
            onClick={() => setTab("eventos")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === "eventos" ? "bg-brand-600 text-white" : "text-slate-500 hover:text-brand-700"
            }`}
          >
            Eventos
          </button>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((item) => (
          <Link
            key={item.slug}
            href={tab === "noticias" ? `/noticias/${item.slug}` : `/eventos/${item.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
          >
            <div
              className="h-32 w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${item.imageUrl || FALLBACK_IMAGE})` }}
            />
            <div className="flex flex-1 flex-col gap-2 p-4">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {"category" in item ? item.category : ""}
              </span>
              <h3 className="text-sm font-bold leading-snug text-brand-900">{item.title}</h3>
              <p className="mt-auto inline-flex items-center gap-1.5 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(tab === "noticias" ? (item as NewsApiData).publishedAt : (item as EventApiData).eventDate)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
