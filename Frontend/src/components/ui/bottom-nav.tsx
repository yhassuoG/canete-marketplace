"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, ShoppingBag, User } from "lucide-react";
import { clsx } from "clsx";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Inicio" },
  { href: "/marketplace", icon: Search, label: "Explorar" },
  { href: "/favoritos", icon: Heart, label: "Favoritos" },
  { href: "/pedidos", icon: ShoppingBag, label: "Pedidos" },
  { href: "/perfil", icon: User, label: "Perfil" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-safe md:hidden">
      <div className="glass border-t border-white/40">
        <div className="flex items-center justify-around px-2 py-2">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "relative flex flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-medium transition-colors",
                  active ? "text-ocean" : "text-slate-400"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="bottom-nav-indicator"
                    className="absolute inset-0 rounded-2xl bg-ocean/10"
                    transition={{ type: "spring", stiffness: 380, damping: 35 }}
                  />
                )}
                <Icon className={clsx("h-5 w-5", active && "fill-current opacity-90")} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
