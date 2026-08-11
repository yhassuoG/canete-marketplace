"use client";

import { Leaf, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConsumerNavButton } from "@/components/consumer/consumer-nav-button";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/distritos", label: "Distritos" },
  { href: "/marketplace?section=que-hacer", label: "Qué hacer" },
  { href: "/restaurantes", label: "Restaurantes" },
  { href: "/hospedajes", label: "Hospedajes" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/noticias", label: "Noticias" },
  { href: "/eventos", label: "Eventos" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-4 z-30 mx-auto w-full max-w-7xl px-4 md:px-6">
      <div className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white/90 px-4 py-3 shadow-soft backdrop-blur md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white">
            <Leaf className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-brand-900">ValleCañete</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className="transition hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            aria-label="Buscar"
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-brand-50 hover:text-brand-700 sm:inline-flex"
          >
            <Search className="h-5 w-5" />
          </Link>
          <div className="hidden sm:block">
            <ConsumerNavButton variant="ghost" />
          </div>
          <Link
            href="/login"
            className="hidden rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 md:inline-flex"
          >
            Publica tu negocio
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-brand-800 transition hover:bg-brand-50 lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-brand-100 bg-white/95 p-3 shadow-soft lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="mt-1 rounded-xl bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white"
          >
            Publica tu negocio
          </Link>
        </div>
      )}
    </header>
  );
}
