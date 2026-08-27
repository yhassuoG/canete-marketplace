"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Settings,
  Shield,
  Zap,
  LogOut,
  ChevronRight,
  MapPin,
  Newspaper,
  CalendarDays,
  Gift,
  Smartphone,
  Receipt,
} from "lucide-react";
import { clearAuthCookie } from "@/lib/auth";

const NAV = [
  {
    group: "Principal",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Overview" },
      { href: "/admin/companies", icon: Building2, label: "Empresas" },
      { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
    ],
  },
  {
    group: "Gestión",
    items: [
      { href: "/admin/users", icon: Users, label: "Usuarios" },
      { href: "/admin/payments", icon: CreditCard, label: "Pagos" },
      { href: "/admin/pagos-yape-plin", icon: Smartphone, label: "Pagos Yape/Plin" },
      { href: "/admin/plans", icon: Zap, label: "Planes SaaS" },
      { href: "/admin/invoicing", icon: Receipt, label: "Facturación" },
      { href: "/admin/recompensas", icon: Gift, label: "Recompensas" },
    ],
  },
  {
    group: "Contenido",
    items: [
      { href: "/admin/districts", icon: MapPin, label: "Distritos" },
      { href: "/admin/news", icon: Newspaper, label: "Noticias" },
      { href: "/admin/events", icon: CalendarDays, label: "Eventos" },
    ],
  },
  {
    group: "Sistema",
    items: [
      { href: "/admin/logs", icon: FileText, label: "Auditoría" },
      { href: "/admin/security", icon: Shield, label: "Seguridad" },
      { href: "/admin/settings", icon: Settings, label: "Configuración" },
    ],
  },
];

export function AdminSidebar({ userName = "Admin" }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearAuthCookie();
    router.push("/login");
  }

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col bg-admin-sidebar sidebar-scroll overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.webp" alt="Cañete" className="h-9 w-9 rounded-xl object-cover" />
        <div>
          <p className="text-sm font-semibold text-white">Cañete</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40">Super Admin</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={clsx(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "text-white"
                          : "text-white/50 hover:text-white/80 hover:bg-white/5"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-indicator"
                          className="absolute inset-0 rounded-xl bg-white/10"
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Icon className="relative h-4 w-4 flex-shrink-0" />
                      <span className="relative">{label}</span>
                      {active && (
                        <ChevronRight className="relative ml-auto h-3.5 w-3.5 opacity-60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white">
          {userName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="truncate text-xs text-white/40">superadmin</p>
        </div>
        <button onClick={handleLogout} className="text-white/30 hover:text-white/70 transition-colors" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
