"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  BarChart3,
  Calendar,
  ShoppingBag,
  Users,
  Megaphone,
  Tag,
  Settings,
  Sparkles,
  Store,
  Package,
  CreditCard,
  ChevronRight,
  LogOut,
  Smartphone,
} from "lucide-react";
import { clearAuthCookie } from "@/lib/auth";
import { useNotifications } from "@/components/dashboard/notification-provider";

const NAV = [
  {
    group: "Negocio",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
      { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/dashboard/reservas", icon: Calendar, label: "Reservas" },
      { href: "/dashboard/delivery", icon: ShoppingBag, label: "Delivery" },
      { href: "/dashboard/pedidos", icon: Package, label: "Pedidos" },
    ],
  },
  {
    group: "Clientes",
    items: [
      { href: "/dashboard/clientes", icon: Users, label: "Clientes" },
      { href: "/dashboard/campanas", icon: Megaphone, label: "Campañas" },
      { href: "/dashboard/cupones", icon: Tag, label: "Cupones" },
    ],
  },
  {
    group: "IA",
    items: [
      { href: "/dashboard/ia", icon: Sparkles, label: "Recomendaciones IA" },
    ],
  },
  {
    group: "Tienda",
    items: [
      { href: "/dashboard/productos", icon: Package, label: "Productos" },
      { href: "/dashboard/tienda", icon: Store, label: "Mi tienda" },
      { href: "/dashboard/pagos", icon: CreditCard, label: "Pagos" },
      { href: "/dashboard/yape-plin", icon: Smartphone, label: "Yape/Plin" },
      { href: "/dashboard/configuracion", icon: Settings, label: "Configuración" },
    ],
  },
];

interface BusinessSidebarProps {
  tenantName?: string;
  tenantSlug?: string;
  primaryColor?: string;
  gradient?: string;
  userName?: string;
  onNavigate?: () => void;
}

export function BusinessSidebar({
  tenantName = "Mi Negocio",
  tenantSlug = "dashboard",
  primaryColor = "#083d77",
  gradient = "linear-gradient(135deg, #083d77 0%, #1a5ba8 100%)",
  userName = "Usuario",
  onNavigate,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  function handleLogout() {
    clearAuthCookie();
    router.push("/login");
    onNavigate?.();
  }

  return (
    <aside
      className="flex h-full w-60 flex-shrink-0 flex-col sidebar-scroll overflow-y-auto border-r border-slate-200 bg-white"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white text-sm font-bold shadow"
          style={{ background: gradient }}
        >
          {tenantName[0]}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink truncate max-w-[120px]">{tenantName}</p>
          <p className="text-[10px] uppercase tracking-widest text-slate-400">Panel de negocio</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {group}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ href, icon: Icon, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      className={clsx(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "text-ink bg-slate-100"
                          : "text-slate-500 hover:text-ink hover:bg-slate-50"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="biz-nav-indicator"
                          className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                          style={{ background: primaryColor }}
                          transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                      )}
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                      {href === "/dashboard/pedidos" && unreadCount > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                      {active && unreadCount === 0 && <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-40" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-4">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold"
          style={{ background: gradient }}
        >
          {userName[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-ink">{userName}</p>
          <p className="truncate text-xs text-slate-400">Propietario</p>
        </div>
        <button type="button" onClick={handleLogout} className="text-slate-300 hover:text-slate-600 transition-colors" title="Cerrar sesión">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
