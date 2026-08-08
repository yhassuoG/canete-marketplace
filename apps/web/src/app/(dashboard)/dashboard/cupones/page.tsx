"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Tag, Copy, CheckCheck, Calendar, Users } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import { fetchCouponsByTenant, type CouponApiData } from "@/lib/api";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function CuponesPage() {
  const [coupons, setCoupons] = useState<CouponApiData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discount: "", type: "percent", minOrder: "", maxUses: "", expires: "" });

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) { setLoading(false); return; }
    fetchCouponsByTenant(user.tenantSlug).then(data => { setCoupons(data); setLoading(false); });
  }, []);

  const copy = (code: string) => { navigator.clipboard.writeText(code); setCopied(code); setTimeout(() => setCopied(null), 2000); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Cupones</h1><p className="text-sm text-slate-400">{coupons.filter(c => c.isActive).length} cupones activos</p></div>
        <button onClick={() => setShowForm(v => !v)} className="flex items-center gap-2 rounded-xl bg-[#0c4a6e] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4"/> Crear cupón
        </button>
      </header>

      <div className="p-6 space-y-5">
        {/* New coupon form */}
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="rounded-3xl border border-[#0c4a6e]/20 bg-white p-6 shadow-soft space-y-4">
            <h3 className="font-semibold text-ink">Nuevo cupón</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Código", key: "code", placeholder: "PROMO25" },
                { label: "Descuento", key: "discount", placeholder: "20", type: "number" },
                { label: "Pedido mínimo S/", key: "minOrder", placeholder: "50", type: "number" },
                { label: "Usos máximos", key: "maxUses", placeholder: "100", type: "number" },
                { label: "Vence el", key: "expires", type: "date" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">{f.label}</label>
                  <input type={f.type || "text"} placeholder={f.placeholder}
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Tipo</label>
                <select value={form.type} onChange={e => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20">
                  <option value="percent">Porcentaje</option><option value="fixed">Monto fijo</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="rounded-xl bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white">Crear cupón</button>
              <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600">Cancelar</button>
            </div>
          </motion.div>
        )}

        {/* Coupon cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full py-12 text-center text-sm text-slate-400">Cargando cupones…</div>
          ) : coupons.map((coupon, i) => {
            const maxUses = coupon.maxUses ?? 0;
            const usagePct = maxUses > 0 ? Math.round((coupon.usedCount / maxUses) * 100) : 0;
            return (
              <motion.div key={coupon.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`rounded-3xl border bg-white p-5 shadow-soft ${!coupon.isActive ? "opacity-60" : "border-slate-100"}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-[#0c4a6e]"/>
                    <span className="font-mono text-sm font-bold text-ink">{coupon.code}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {coupon.isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Activo</span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Inactivo</span>
                    )}
                    <button onClick={() => copy(coupon.code)} className="text-slate-400 hover:text-[#0c4a6e]">
                      {copied === coupon.code ? <CheckCheck className="h-4 w-4 text-emerald-500"/> : <Copy className="h-4 w-4"/>}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-4">
                  <span className="text-3xl font-bold text-ink">{coupon.value}{coupon.type === "percentage" ? "%" : " S/"}</span>
                  <span className="text-sm text-slate-400">de descuento{coupon.minOrder > 0 ? ` (mín S/${coupon.minOrder})` : ""}</span>
                </div>
                <div className="space-y-2 text-xs text-slate-500">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{coupon.usedCount}/{maxUses > 0 ? maxUses : "∞"} usos</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>Vence {formatDate(coupon.validUntil)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div className={`h-full rounded-full transition-all ${usagePct >= 90 ? "bg-red-400" : usagePct >= 60 ? "bg-amber-400" : "bg-[#0c4a6e]"}`} style={{ width: `${usagePct}%` }}/>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {!loading && coupons.length === 0 && <div className="col-span-full py-12 text-center text-sm text-slate-400">No hay cupones creados</div>}
        </div>
      </div>
    </div>
  );
}
