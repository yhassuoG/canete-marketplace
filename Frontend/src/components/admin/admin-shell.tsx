"use client";

import { useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";

/**
 * Shell del admin: en desktop muestra el sidebar fijo (w-64),
 * en mobile lo oculta y muestra un botón hamburguesa que abre un drawer overlay.
 */
export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar desktop */}
      <div className="hidden md:flex">
        <AdminSidebar userName={userName} />
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={close}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Panel */}
          <div className="absolute left-0 top-0 h-full animate-in">
            <AdminSidebar userName={userName} onNavigate={close} />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={close}
              className="absolute right-3 top-4 rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar mobile */}
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-ink">Admin</span>
        </div>
        {children}
      </main>
    </div>
  );
}
