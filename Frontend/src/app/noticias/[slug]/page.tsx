import { ArrowLeft, CalendarDays, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchNewsBySlug } from "@/lib/api";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

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
  const article = await fetchNewsBySlug(slug);
  if (!article) return { title: "Noticia no encontrada — ValleCañete" };
  return {
    title: `${article.title} — Noticias ValleCañete`,
    description: article.summary || article.title,
  };
}

const FALLBACK_IMAGE =
  "https://picsum.photos/seed/canete-news/1200/800";

export default async function NoticiaDetailPage({ params }: Readonly<Props>) {
  const { slug } = await params;
  const article = await fetchNewsBySlug(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 md:px-6">
        <Link
          href="/noticias"
          className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a noticias
        </Link>

        <article className="overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft">
          <div
            className="h-56 w-full bg-cover bg-center bg-brand-100 md:h-80"
            style={{ backgroundImage: `url(${article.imageUrl || FALLBACK_IMAGE})` }}
          />
          <div className="space-y-4 p-6 md:p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700">
                <Newspaper className="h-3.5 w-3.5" />
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-400">
                <CalendarDays className="h-4 w-4" />
                {formatDate(article.publishedAt)}
              </span>
            </div>

            <h1 className="text-3xl font-bold leading-tight text-brand-900 md:text-4xl">
              {article.title}
            </h1>

            {article.summary && (
              <p className="text-lg leading-relaxed text-slate-600">{article.summary}</p>
            )}

            {article.content && (
              <div className="prose prose-slate max-w-none">
                <p>{article.content}</p>
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
