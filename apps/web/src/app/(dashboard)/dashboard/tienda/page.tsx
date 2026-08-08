"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Store, Camera, Plus, X, Clock, MapPin, Phone, Globe } from "lucide-react";

const DEFAULT_HOURS = [
  { day: "Lunes", open: "11:00", close: "22:00", closed: false },
  { day: "Martes", open: "11:00", close: "22:00", closed: false },
  { day: "Miércoles", open: "11:00", close: "22:00", closed: false },
  { day: "Jueves", open: "11:00", close: "22:00", closed: false },
  { day: "Viernes", open: "11:00", close: "23:00", closed: false },
  { day: "Sábado", open: "10:00", close: "23:00", closed: false },
  { day: "Domingo", open: "10:00", close: "22:00", closed: false },
];

export default function TiendaPage() {
  const [saved, setSaved] = useState(false);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [form, setForm] = useState({
    name: "Muelle Pacifico",
    tagline: "El mejor ceviche de Cañete",
    description: "Restaurante de pescados y mariscos frente al mar. Tradición y sabor desde 1998.",
    phone: "+51 944 001 001",
    website: "muellepacifico.com",
    address: "Malecón San Vicente s/n, San Vicente de Cañete",
    category: "restaurant",
  });

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-2"><Store className="h-5 w-5 text-[#0c4a6e]"/>
          <div><h1 className="text-lg font-semibold text-ink">Mi tienda</h1><p className="text-sm text-slate-400">Personaliza la página pública de tu negocio</p></div>
        </div>
        <button onClick={save} className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-[#0c4a6e]"}`}>
          {saved ? "¡Guardado!" : "Guardar cambios"}
        </button>
      </header>

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft space-y-4">
          <h3 className="font-semibold text-ink">Información básica</h3>
          {[
            { label: "Nombre del negocio", key: "name" },
            { label: "Eslogan", key: "tagline" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">{f.label}</label>
              <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
            <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20 resize-none"/>
          </div>

          <h3 className="font-semibold text-ink pt-2">Contacto</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Teléfono", key: "phone", icon: Phone },
              { label: "Sitio web", key: "website", icon: Globe },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">{f.label}</label>
                <div className="relative">
                  <f.icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1.5">Dirección</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
          </div>
        </motion.div>

        {/* Hours */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-5"><Clock className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Horario de atención</h3></div>
          <div className="space-y-3">
            {hours.map((h, i) => (
              <div key={h.day} className="flex items-center gap-3">
                <span className="w-24 text-sm text-slate-600 flex-shrink-0">{h.day}</span>
                {h.closed ? (
                  <span className="flex-1 text-sm text-slate-400 italic">Cerrado</span>
                ) : (
                  <div className="flex flex-1 items-center gap-2">
                    <input type="time" value={h.open} onChange={e => setHours(prev => prev.map((p, j) => j === i ? { ...p, open: e.target.value } : p))}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
                    <span className="text-slate-400 text-sm">–</span>
                    <input type="time" value={h.close} onChange={e => setHours(prev => prev.map((p, j) => j === i ? { ...p, close: e.target.value } : p))}
                      className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
                  </div>
                )}
                <button onClick={() => setHours(prev => prev.map((p, j) => j === i ? { ...p, closed: !p.closed } : p))}
                  className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${h.closed ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {h.closed ? "Abrir" : "Cerrar"}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
