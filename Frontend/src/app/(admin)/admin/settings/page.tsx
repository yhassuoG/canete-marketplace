"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Bell, Mail, Smartphone, CreditCard } from "lucide-react";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    platformName: "vallecanete",
    supportEmail: "soporte@canete.app",
    domain: "canete.app",
    currency: "PEN",
    timezone: "America/Lima",
    commissionRate: "3",
    trialDays: "14",
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    stripeEnabled: false,
    yapeEnabled: true,
    plinEnabled: true,
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const Field = ({ label, name, type = "text" }: { label: string; name: keyof typeof form; type?: string }) => (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1.5">{label}</label>
      <input type={type} value={form[name] as string}
        onChange={e => setForm(prev => ({ ...prev, [name]: e.target.value }))}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20"/>
    </div>
  );

  const Toggle = ({ label, name, desc }: { label: string; name: keyof typeof form; desc?: string }) => (
    <div className="flex items-center justify-between py-3">
      <div><p className="text-sm font-medium text-ink">{label}</p>{desc && <p className="text-xs text-slate-400">{desc}</p>}</div>
      <button onClick={() => setForm(prev => ({ ...prev, [name]: !prev[name] }))}
        className={`relative h-6 w-11 rounded-full transition-colors ${form[name] ? "bg-[#083d77]" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form[name] ? "translate-x-5" : "translate-x-0.5"}`}/>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-ink">Configuración</h1><p className="text-sm text-slate-400 mt-1">Ajustes globales de la plataforma</p></div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors ${saved ? "bg-emerald-500" : "bg-[#083d77]"}`}>
          <Save className="h-4 w-4"/>{saved ? "¡Guardado!" : "Guardar cambios"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft space-y-5">
          <div className="flex items-center gap-2 mb-2"><Globe className="h-4 w-4 text-[#083d77]"/><h3 className="font-semibold text-ink">General</h3></div>
          <Field label="Nombre de la plataforma" name="platformName"/>
          <Field label="Dominio principal" name="domain"/>
          <Field label="Email de soporte" name="supportEmail" type="email"/>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Moneda</label>
              <select value={form.currency} onChange={e => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20">
                <option>PEN</option><option>USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Zona horaria</label>
              <select value={form.timezone} onChange={e => setForm(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20">
                <option>America/Lima</option><option>UTC</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Comisión (%)" name="commissionRate" type="number"/>
            <Field label="Días de prueba gratis" name="trialDays" type="number"/>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-[#083d77]"/><h3 className="font-semibold text-ink">Notificaciones</h3></div>
          <div className="divide-y divide-slate-50">
            <Toggle label="Email" name="emailEnabled" desc="Notificaciones por correo electrónico"/>
            <Toggle label="SMS" name="smsEnabled" desc="Mensajes de texto vía Twilio"/>
            <Toggle label="Push notifications" name="pushEnabled" desc="Notificaciones web / PWA"/>
          </div>
          <div className="mt-6 flex items-center gap-2"><CreditCard className="h-4 w-4 text-[#083d77]"/><h3 className="font-semibold text-ink">Métodos de pago</h3></div>
          <div className="mt-2 divide-y divide-slate-50">
            <Toggle label="Stripe" name="stripeEnabled" desc="Tarjetas de crédito/débito"/>
            <Toggle label="Yape" name="yapeEnabled" desc="Billetera digital Yape"/>
            <Toggle label="Plin" name="plinEnabled" desc="Billetera digital Plin"/>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
