import { MapPin, Star, Users } from "lucide-react";
import Link from "next/link";

import { Business, featuredBusinesses } from "@/lib/data";

const tierBorder: Record<Business["adTier"], string> = {
  premium: "border-coral/40 ring-1 ring-coral/20",
  destacado: "border-amber-300/60 ring-1 ring-amber-200/30",
  basico: "border-slate-200",
};

const tierBadge: Record<Business["adTier"], string> = {
  premium: "bg-coral text-white",
  destacado: "bg-amber-500 text-white",
  basico: "bg-slate-100 text-slate-500",
};

function BusinessCard({ business }: Readonly<{ business: Business }>) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-lg ${tierBorder[business.adTier]}`}
    >
      {/* Image / gradient header */}
      <div className={`relative h-40 bg-gradient-to-br ${business.accent}`}>
        {business.badge && (
          <div
            className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${tierBadge[business.adTier]}`}
          >
            {business.badge}
          </div>
        )}
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-sm font-bold text-ink shadow-sm">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          {business.score}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
            {business.category}
          </p>
          <h3 className="mt-0.5 text-xl font-bold text-ink">{business.name}</h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-sm text-slate-600">{business.tagline}</p>

        <div className="flex items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {business.location}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-4 w-4" />
            {business.reviews.toLocaleString()}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs text-slate-400">Desde</p>
            <p className="text-lg font-bold text-ink">
              S/ {business.priceFrom}
            </p>
          </div>
          <Link
            href={`/marketplace`}
            className="rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
          >
            Ver negocio
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BusinessSpotlight() {
  // Sort by tier: premium first, then destacado, then basico
  const tierOrder = { premium: 0, destacado: 1, basico: 2 };
  const sorted = [...featuredBusinesses].sort(
    (a, b) => tierOrder[a.adTier] - tierOrder[b.adTier]
  );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((business) => (
        <BusinessCard key={business.tenantSlug} business={business} />
      ))}
    </div>
  );
}
