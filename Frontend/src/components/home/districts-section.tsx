import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

import type { DistrictApiData } from "@/lib/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1583212292454-39d2ba9d9614?auto=format&fit=crop&w=800&q=60";

export function DistrictsSection({ districts }: Readonly<{ districts: DistrictApiData[] }>) {
  if (districts.length === 0) return null;

  return (
    <section id="distritos" className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
            <MapPin className="h-4 w-4" />
            EXPLORA CAÑETE
          </p>
          <h2 className="mt-2 text-3xl font-bold text-brand-900 md:text-4xl">
            Explora nuestros distritos
          </h2>
        </div>
        <Link
          href="/distritos"
          className="hidden items-center gap-1 text-sm font-semibold text-brand-700 transition hover:text-brand-800 md:inline-flex"
        >
          Ver todos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {districts.slice(0, 6).map((district) => (
          <Link
            key={district.slug}
            href={`/distritos/${district.slug}`}
            className="group overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-soft transition hover:-translate-y-1 hover:shadow-card"
          >
            <div
              className="h-24 w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
              style={{ backgroundImage: `url(${district.imageUrl || FALLBACK_IMAGE})` }}
            />
            <div className="p-3">
              <h3 className="text-sm font-bold text-brand-900">{district.name}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{district.placesCount} lugares</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center md:hidden">
        <Link href="/distritos" className="text-sm font-semibold text-brand-700">
          Ver todos los distritos →
        </Link>
      </div>
    </section>
  );
}
