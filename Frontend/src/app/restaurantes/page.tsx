"use client";

import { MapPin, Search, Star, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { fetchTenants, type TenantApiData } from "@/lib/api";

type SortKey = "rating" | "name";

export default function RestaurantesPage() {
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [sort, setSort] = useState<SortKey>("rating");
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTenants()
      .then((data) => {
        if (!cancelled) {
          setTenants(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const restaurants = useMemo(
    () => tenants.filter((t) => t.category === "restaurant" && t.status === "active"),
    [tenants]
  );

  const districts = useMemo(
    () =>
      Array.from(new Set(restaurants.map((t) => t.location).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [restaurants]
  );

  const filtered = useMemo(() => {
    let list = restaurants.filter((t) => {
      const matchesQuery =
        !query ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        (t.tagline ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesDistrict = !district || t.location === district;
      return matchesQuery && matchesDistrict;
    });
    list = [...list].sort((a, b) =>
      sort === "rating" ? (b.rating ?? 0) - (a.rating ?? 0) : a.name.localeCompare(b.name)
    );
    return list;
  }, [restaurants, query, district, sort]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6">
        <section className="rounded-3xl border border-brand-100 bg-hero-nature p-8 shadow-soft md:p-10">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
            <UtensilsCrossed className="h-4 w-4" />
            SABORES DE CAÑETE
          </p>
          <h1 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">Restaurantes</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Cocina marina, criolla y de autor. Descubre los mejores restaurantes del Valle de
            Cañete, con reserva y delivery donde el negocio lo ofrezca.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar restaurante..."
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-base text-brand-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-brand-900 shadow-sm outline-none"
            >
              <option value="">Todos los distritos</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-brand-900 shadow-sm outline-none"
            >
              <option value="rating">Mejor valorados</option>
              <option value="name">Nombre (A-Z)</option>
            </select>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-brand-900">
            {loading ? "Cargando..." : `${filtered.length} restaurantes encontrados`}
          </h2>

          {!loading && filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No se encontraron restaurantes con esos filtros.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
                >
                  <div
                    className="h-40 w-full bg-cover bg-center bg-brand-100 transition duration-300 group-hover:scale-105"
                    style={r.bannerUrl ? { backgroundImage: `url(${r.bannerUrl})` } : undefined}
                  />
                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-lg font-bold text-brand-900">{r.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        {r.rating?.toFixed(1) ?? "—"}
                      </span>
                    </div>
                    <p className="inline-flex items-center gap-1 text-sm text-slate-500">
                      <MapPin className="h-4 w-4" />
                      {r.location || "Cañete"}
                    </p>
                    {r.tagline && (
                      <p className="line-clamp-2 text-sm text-slate-600">{r.tagline}</p>
                    )}
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
