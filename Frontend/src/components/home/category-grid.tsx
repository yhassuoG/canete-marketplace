import Link from "next/link";

import { categories } from "@/lib/data";

export function CategoryGrid() {
  return (
    <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.title}
          href="/marketplace"
          className="group relative overflow-hidden rounded-3xl border border-brand-100 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
        >
          <div
            className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${category.gradient} text-2xl shadow-md`}
          >
            {category.emoji}
          </div>
          <h3 className="text-lg font-bold text-brand-900">{category.title}</h3>
          <p className="mt-1 text-sm leading-5 text-slate-500">{category.description}</p>
          <p className="mt-3 text-xs font-semibold text-brand-600">{category.metric}</p>
          <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-slate-50 opacity-0 transition group-hover:opacity-100" />
        </Link>
      ))}
    </section>
  );
}
