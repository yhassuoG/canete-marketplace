"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Star, ShoppingBag, Phone, Mail, Crown, Users } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { fetchCustomersByTenant } from "@/lib/api";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  visits: number;
  spent: number;
  loyaltyPoints: number;
  loyalty: "platinum" | "gold" | "silver" | "bronze";
  joinedDate: string | null;
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

const LOYALTY_STYLE: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  platinum: { label: "Platinum", bg: "bg-violet-50", text: "text-violet-700", icon: <Crown className="h-3 w-3" /> },
  gold:     { label: "Gold",     bg: "bg-amber-50",  text: "text-amber-700",  icon: <Star className="h-3 w-3 fill-current" /> },
  silver:   { label: "Silver",   bg: "bg-slate-100", text: "text-slate-600",  icon: null },
  bronze:   { label: "Bronze",   bg: "bg-orange-50", text: "text-orange-600", icon: null },
};

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [sort, setSort]           = useState<"spent" | "visits">("spent");

  useEffect(() => {
    const user = getAuthUser();
    const slug = user?.tenantSlug;
    if (!slug) { setLoading(false); return; }
    fetchCustomersByTenant(slug)
      .then(data => setCustomers(data as unknown as Customer[]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => sort === "spent" ? b.spent - a.spent : b.visits - a.visits);

  const newThisMonth = customers.filter(c => {
    if (!c.joinedDate) return false;
    const d = new Date(c.joinedDate); const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const retention = customers.length > 0
    ? Math.round((customers.filter(c => c.visits > 1).length / customers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div>
          <h1 className="text-lg font-semibold text-ink">Clientes</h1>
          <p className="text-sm text-slate-400">
            {loading ? "Cargando…" : `${customers.length} clientes registrados`}
          </p>
        </div>
      </header>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total clientes",  value: loading ? "…" : customers.length },
            { label: "Nuevos este mes", value: loading ? "…" : newThisMonth },
            { label: "Tasa retención",  value: loading ? "…" : `${retention}%` },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft text-center">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente…"
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20 shadow-soft" />
          </div>
          <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 shadow-soft">
            <button onClick={() => setSort("spent")}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium ${sort === "spent" ? "bg-[#0c4a6e] text-white" : "text-slate-500"}`}>
              Por gasto
            </button>
            <button onClick={() => setSort("visits")}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium ${sort === "visits" ? "bg-[#0c4a6e] text-white" : "text-slate-500"}`}>
              Por visitas
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft animate-pulse">
                <div className="flex gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1"><div className="h-4 bg-slate-200 rounded w-3/4" /><div className="h-3 bg-slate-100 rounded w-1/2" /></div>
                </div>
                <div className="h-16 bg-slate-100 rounded-2xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && customers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-slate-300" />
            </div>
            <p className="font-semibold text-slate-600">Aún no hay clientes</p>
            <p className="text-sm text-slate-400 mt-1">Los clientes aparecerán aquí cuando hagan reservas o pedidos</p>
          </div>
        )}

        {/* Customer cards */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c, i) => {
              const loyalty = LOYALTY_STYLE[c.loyalty] ?? LOYALTY_STYLE.bronze;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.name}
                          className="h-12 w-12 rounded-full object-cover border border-slate-100" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0c4a6e] to-[#0369a1] flex items-center justify-center text-sm font-bold text-white">
                          {initials(c.name)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-ink">{c.name}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${loyalty.bg} ${loyalty.text}`}>
                          {loyalty.icon}{loyalty.label}
                        </span>
                      </div>
                    </div>
                    {c.loyaltyPoints > 0 && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">{c.loyaltyPoints} pts</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div className="rounded-2xl bg-slate-50 p-2"><p className="text-sm font-bold text-ink">{c.visits}</p><p className="text-[10px] text-slate-400">Pedidos</p></div>
                    <div className="rounded-2xl bg-slate-50 p-2"><p className="text-sm font-bold text-ink">S/{c.spent.toFixed(0)}</p><p className="text-[10px] text-slate-400">Gastado</p></div>
                    <div className="rounded-2xl bg-slate-50 p-2">
                      <ShoppingBag className="h-4 w-4 text-slate-400 mx-auto" />
                      <p className="text-[10px] text-slate-400">
                        {c.joinedDate ? new Date(c.joinedDate).toLocaleDateString("es-PE",{day:"2-digit",month:"short"}) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                        <Phone className="h-3.5 w-3.5" />Llamar
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0c4a6e] py-2 text-xs font-medium text-white">
                        <Mail className="h-3.5 w-3.5" />Email
                      </a>
                    )}
                    {!c.phone && !c.email && (
                      <span className="text-xs text-slate-400 italic w-full text-center py-2">Sin contacto</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
