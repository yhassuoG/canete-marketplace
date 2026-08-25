import { Globe, MessageCircle } from "lucide-react";
import Link from "next/link";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explora",
    links: [
      { label: "Inicio", href: "/" },
      { label: "Distritos", href: "/distritos" },
      { label: "Restaurantes", href: "/restaurantes" },
      { label: "Hospedajes", href: "/hospedajes" },
      { label: "Marketplace", href: "/marketplace" },
    ],
  },
  {
    title: "Información",
    links: [
      { label: "Noticias", href: "/noticias" },
      { label: "Eventos", href: "/eventos" },
      { label: "Mi cuenta", href: "/mi-cuenta" },
      { label: "Iniciar sesión", href: "/login" },
    ],
  },
  {
    title: "Para negocios",
    links: [
      { label: "Publica tu negocio", href: "/login" },
      { label: "Planes", href: "/#planes" },
      { label: "Ayuda", href: "/login" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="overflow-hidden rounded-3xl bg-gradient-to-b from-brand-900 to-brand-800 p-8 text-white md:p-12">
      <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.webp" alt="ValleCañete" className="h-9 w-9 rounded-xl object-cover" />
            <span className="text-lg font-bold">ValleCañete</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-white/70">
            Naturaleza, cultura y sabor. El portal oficial para descubrir, visitar, comprar y
            disfrutar el Valle de Cañete.
          </p>
          <div className="mt-5 flex items-center gap-3 text-white/80">
            <Globe className="h-4 w-4" />
            <MessageCircle className="h-4 w-4" />
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-white/80">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
        © {new Date().getFullYear()} ValleCañete.com — Todos los derechos reservados.
      </div>
    </footer>
  );
}
