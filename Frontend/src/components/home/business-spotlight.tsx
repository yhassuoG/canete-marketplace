"use client";

import { MapPin, Star, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Business, featuredBusinesses } from "@/lib/data";
import { fetchFeaturedTenants, type TenantApiData } from "@/lib/api";

const tierBorder: Record<Business["adTier"], string> = {
  premium: "border-brand-400/50 ring-1 ring-brand-300/30",
  destacado: "border-amber-300/60 ring-1 ring-amber-200/30",
  basico: "border-slate-200",
};

const tierBadge: Record<Business["adTier"], string> = {
  premium: "bg-brand-600 text-white",
  destacado: "bg-amber-500 text-white",
  basico: "bg-slate-100 text-slate-500",
};

/** Map a TenantApiData from the API to the Business card shape. */
function tenantToBusiness(t: TenantApiData): Business {
  const planToTier = (plan: string): Business["adTier"] => {
    if (plan === "premium" || plan === "enterprise") return "premium";
    if (plan === "starter") return "destacado";
    return "basico";
  };
  return {
    name: t.name,
    category: t.category,
    location: t.location,
    score: t.rating,
    reviews: t.reviewCount,
    tenantSlug: t.slug,
    accent: "from-slate-700 to-slate-900",
    adTier: planToTier(t.plan),
    tagline: t.tagline || t.description?.slice(0, 80) || "",
    priceFrom: 20,
    image: "",
    imageUrl: t.bannerUrl ?? undefined,
    badge: t.plan.charAt(0).toUpperCase() + t.plan.slice(1),
  };
}

function BusinessCard({ business }: Readonly<{ business: Business }>) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card ${tierBorder[business.adTier]}`}
    >
      {/* Image / gradient header */}
      <div
        className={`relative h-40 bg-gradient-to-br ${business.accent}`}
        style={
          business.imageUrl
            ? {
                backgroundImage: `url(${business.imageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
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
          <p className="text-xs font-medium uppercase tracking-widest text-white/90">
            {business.category}
          </p>
          <h3 className="mt-0.5 text-xl font-bold text-white drop-shadow-sm">{business.name}</h3>
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
            <p className="text-lg font-bold text-brand-900">
              S/ {business.priceFrom}
            </p>
          </div>
          <Link
            href={`/${business.tenantSlug}`}
            className="rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            Ver negocio
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BusinessSpotlight() {
  const [businesses, setBusinesses] = useState<Business[]>(featuredBusinesses);

  useEffect(() => {
    let active = true;
    async function load() {
      const featured = await fetchFeaturedTenants();
      if (!active || featured.length === 0) return;
      setBusinesses(featured.map(tenantToBusiness));
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Sort by tier: premium first, then destacado, then basico
  const tierOrder = { premium: 0, destacado: 1, basico: 2 };
  const sorted = [...businesses].sort(
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
