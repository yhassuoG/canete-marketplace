"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Mail, Smartphone, CheckCircle2, Clock, XCircle, Users } from "lucide-react";

const CAMPAIGNS = [
  { id: "cp1", name: "Promo Fines de Semana", channel: "email", audience: 234, opened: 112, clicked: 48, status: "active", sentAt: "20 May 2026", ctr: 20.5 },
  { id: "cp2", name: "Menú especial 28 de Julio", channel: "push", audience: 189, opened: 145, clicked: 67, status: "scheduled", sentAt: "25 Jul 2026", ctr: 35.4 },
  { id: "cp3", name: "Aniversario: 20% desc.", channel: "email", audience: 256, opened: 198, clicked: 88, status: "completed", sentAt: "15 May 2026", ctr: 34.4 },
  { id: "cp4", name: "Recupera tu mesa", channel: "sms", audience: 42, opened: 42, clicked: 18, status: "completed", sentAt: "10 May 2026", ctr: 42.9 },
];

const STATUS_STYLE = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Activa", icon: CheckCircle2 },
  scheduled: { bg: "bg-blue-50", text: "text-blue-700", label: "Programada", icon: Clock },
  completed: { bg: "bg-slate-100", text: "text-slate-600", label: "Completada", icon: CheckCircle2 },
  draft: { bg: "bg-amber-50", text: "text-amber-700", label: "Borrador", icon: Clock },
};

const CHANNEL_ICON = { email: Mail, push: Smartphone, sms: Megaphone };

export default function CampanasPage() {
  const [showNew, setShowNew] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div><h1 className="text-lg font-semibold text-ink">Campañas</h1><p className="text-sm text-slate-400">Email, push y SMS marketing</p></div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 rounded-xl bg-[#0c4a6e] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4"/> Nueva campaña
        </button>
      </header>

      <div className="p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Campañas activas", value: CAMPAIGNS.filter(c => c.status === "active").length },
            { label: "Emails enviados", value: CAMPAIGNS.reduce((s, c) => s + c.audience, 0) },
            { label: "CTR promedio", value: `${(CAMPAIGNS.reduce((s, c) => s + c.ctr, 0) / CAMPAIGNS.length).toFixed(1)}%` },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft text-center">
              <p className="text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-slate-400 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Campaign list */}
        <div className="space-y-3">
          {CAMPAIGNS.map((c, i) => {
            const St = STATUS_STYLE[c.status as keyof typeof STATUS_STYLE];
            const ChIcon = CHANNEL_ICON[c.channel as keyof typeof CHANNEL_ICON];
            const openRate = Math.round((c.opened / c.audience) * 100);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0c4a6e]/10">
                      <ChIcon className="h-5 w-5 text-[#0c4a6e]"/>
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-slate-400 capitalize">{c.channel} · {c.sentAt}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${St.bg} ${St.text}`}>
                    <St.icon className="h-3 w-3"/>{St.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { label: "Audiencia", value: c.audience },
                    { label: "Aperturas", value: c.opened },
                    { label: "Clics", value: c.clicked },
                    { label: "CTR", value: `${c.ctr}%` },
                  ].map(m => (
                    <div key={m.label} className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-sm font-bold text-ink">{m.value}</p>
                      <p className="text-[10px] text-slate-400">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[#0c4a6e]" style={{ width: `${openRate}%` }}/>
                </div>
                <p className="mt-1 text-xs text-slate-400">Tasa de apertura: {openRate}%</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
