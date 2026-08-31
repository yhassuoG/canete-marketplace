"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building2, Save, Loader2, Gift, AlertCircle } from "lucide-react";
import { fetchPlans, updatePlan } from "@/lib/api";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  trialDays: number;
  hasMp: boolean;
  maxMpSalesMonth: number;
  isActive: boolean;
  sortOrder: number;
}

const PLAN_ICONS: Record<string, any> = {
  free: Zap, trial: Gift, starter: Zap, premium: Crown, enterprise: Building2,
};
const PLAN_COLORS: Record<string, string> = {
  free: "#64748b", trial: "#f59e0b", starter: "#0369a1", premium: "#7c3aed", enterprise: "#b45309",
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans()
      .then(data => setPlans(data ?? []))
      .catch(() => setError("No se pudieron cargar los planes"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (planName: string, field: string, value: any) => {
    setPlans(prev => prev.map(p => p.name === planName ? { ...p, [field]: value } : p));
  };

  const handleSave = async (plan: Plan) => {
    setSavingId(plan.name);
    setError(null);
    try {
      await updatePlan(plan.name, {
        displayName:       plan.displayName,
        priceMonthly:      plan.priceMonthly,
        maxProducts:       plan.maxProducts,
        maxOrdersPerMonth: plan.maxOrdersPerMonth,
        trialDays:         plan.trialDays,
        hasMp:             plan.hasMp,
        maxMpSalesMonth:   plan.maxMpSalesMonth,
        isActive:          plan.isActive,
        sortOrder:         plan.sortOrder,
      });
    } catch (e: any) {
      setError(`Error al guardar ${plan.name}: ${e?.message}`);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Planes SaaS</h1>
          <p className="text-sm text-slate-400 mt-1">Configura precios y límites de cada plan</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Plan cards editable */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan, i) => {
          const PlanIcon = PLAN_ICONS[plan.name] ?? Zap;
          const color = PLAN_COLORS[plan.name] ?? "#0369a1";
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-soft space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlanIcon className="w-5 h-5" style={{ color }} />
                  <input
                    type="text"
                    value={plan.displayName}
                    onChange={e => handleUpdate(plan.name, "displayName", e.target.value)}
                    className="font-semibold text-ink bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => handleUpdate(plan.name, "isActive", !plan.isActive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${plan.isActive ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${plan.isActive ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-slate-500">S/</span>
                <input
                  type="number"
                  value={plan.priceMonthly}
                  onChange={e => handleUpdate(plan.name, "priceMonthly", Number(e.target.value))}
                  className="text-3xl font-bold text-ink w-24 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                />
                <span className="text-sm text-slate-400">/mes</span>
              </div>

              {/* Limits grid */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <Field label="Productos máx." value={plan.maxProducts} onChange={v => handleUpdate(plan.name, "maxProducts", v)} />
                <Field label="Pedidos/mes" value={plan.maxOrdersPerMonth} onChange={v => handleUpdate(plan.name, "maxOrdersPerMonth", v)} />
                <Field label="Días trial" value={plan.trialDays} onChange={v => handleUpdate(plan.name, "trialDays", v)} />
                <Field label="Ventas MP/mes" value={plan.maxMpSalesMonth} onChange={v => handleUpdate(plan.name, "maxMpSalesMonth", v)} hint="-1 = ilimitado" />
              </div>

              {/* MP toggle */}
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-slate-600">Mercado Pago automático</span>
                <button
                  onClick={() => handleUpdate(plan.name, "hasMp", !plan.hasMp)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${plan.hasMp ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${plan.hasMp ? "translate-x-5" : ""}`} />
                </button>
              </label>

              {/* Save */}
              <button
                onClick={() => handleSave(plan)}
                disabled={savingId === plan.name}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#083d77] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a4a8c] disabled:opacity-50"
              >
                {savingId === plan.name ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint }: { label: string; value: number; onChange: (v: number) => void; hint?: string }) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full px-2 py-1 rounded border border-slate-200 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}
