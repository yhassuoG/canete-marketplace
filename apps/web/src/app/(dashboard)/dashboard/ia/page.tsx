"use client";

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Clock, Target, RefreshCw, ChevronRight } from "lucide-react";

const INSIGHTS = [
  { category: "Precio", icon: "📈", title: "Sube el ceviche un 8%", body: "La demanda de ceviche está +24% respecto al mes anterior. El precio actual (S/38) está por debajo del promedio competitivo (S/42) en la zona.", action: "Ajustar precio", impact: "high", saving: "+S/320/sem" },
  { category: "Horarios", icon: "⏰", title: "Happy hour 18–19h aumenta reservas", body: "Tus clientes de los viernes llegan antes a las 19h. Un happy hour 18-19h puede aumentar las reservas un 15% y el ticket promedio.", action: "Crear promoción", impact: "medium", saving: "+S/180/sem" },
  { category: "Capacidad", icon: "🎯", title: "3 mesas sin reservas este fin de semana", body: "3 mesas de terraza tienen 0 reservas para el sábado y domingo. Una promo 2x1 en bebidas puede llenarlas.", action: "Lanzar promo", impact: "high", saving: "+S/240/fin de semana" },
  { category: "Fidelización", icon: "👑", title: "15 clientes VIP sin visita en 30 días", body: "Tienes 15 clientes Gold/Platinum que no han visitado en más de 30 días. Un email personalizado puede recuperarlos.", action: "Enviar campaña", impact: "medium", saving: "+S/1500 esperado" },
  { category: "Menú", icon: "🍽️", title: "Remueve el Chicharrón de Cerdo del menú", body: "El Chicharrón de Cerdo tiene la calificación más baja (3.8/5) y solo 4 pedidos en el último mes. Reemplazarlo puede mejorar la satisfacción global.", action: "Ver menú", impact: "low", saving: "Ahorra rechazo" },
];

const IMPACT_BADGE = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-500",
};
const IMPACT_LABEL = { high: "Alto impacto", medium: "Impacto medio", low: "Bajo impacto" };

export default function IAPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[#0c4a6e]"/>
          <div><h1 className="text-lg font-semibold text-ink">Recomendaciones IA</h1><p className="text-sm text-slate-400">Basado en los últimos 90 días de datos</p></div>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-soft">
          <RefreshCw className="h-3.5 w-3.5"/> Actualizar
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* Summary banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-br from-[#0c4a6e] via-[#0369a1] to-[#0891b2] p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="h-5 w-5 text-amber-300"/>
            <h2 className="font-semibold text-lg">Potencial de mejora este mes</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Ingresos adicionales", value: "S/2,240+", icon: TrendingUp },
              { label: "Clientes recuperables", value: "15", icon: Target },
              { label: "Acciones recomendadas", value: INSIGHTS.length.toString(), icon: Sparkles },
            ].map(s => (
              <div key={s.label} className="rounded-2xl bg-white/10 p-3 text-center">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-white/70 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Insights */}
        <div className="space-y-4">
          {INSIGHTS.map((ins, i) => (
            <motion.div key={ins.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
              <div className="flex items-start gap-4">
                <span className="text-2xl flex-shrink-0">{ins.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${IMPACT_BADGE[ins.impact as keyof typeof IMPACT_BADGE]}`}>
                      {IMPACT_LABEL[ins.impact as keyof typeof IMPACT_LABEL]}
                    </span>
                    <span className="text-xs text-slate-400">{ins.category}</span>
                  </div>
                  <h3 className="font-semibold text-ink mb-1">{ins.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{ins.body}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-600">{ins.saving}</span>
                    <button className="flex items-center gap-1.5 rounded-xl bg-[#0c4a6e] px-4 py-2 text-xs font-semibold text-white">
                      {ins.action} <ChevronRight className="h-3 w-3"/>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
