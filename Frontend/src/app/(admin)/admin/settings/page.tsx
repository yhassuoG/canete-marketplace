"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Globe, Bell, Mail, Smartphone, Wrench, AlertTriangle } from "lucide-react";
import { fetchMaintenanceStatus, setMaintenanceMode } from "@/lib/api";

export default function AdminSettingsPage() {
  const [saved, setSaved] = useState(false);
  const [maintenanceOn, setMaintenanceOn] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
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
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  // Cargar estado de mantenimiento al montar
  useEffect(() => {
    setMaintenanceLoading(true);
    fetchMaintenanceStatus().then((status) => {
      setMaintenanceOn(status.enabled);
      setMaintenanceLoading(false);
    });
  }, []);

  // Toggle mantenimiento → llama al backend
  const handleMaintenanceToggle = async () => {
    const newValue = !maintenanceOn;
    setMaintenanceOn(newValue); // optimista
    setMaintenanceSaving(true);
    const res = await setMaintenanceMode(newValue);
    if (!res.ok) {
      setMaintenanceOn(!newValue); // revertir
    }
    setMaintenanceSaving(false);
  };

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

      {/* ── Modo Mantenimiento ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`rounded-3xl border p-6 shadow-soft ${maintenanceOn ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-white"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${maintenanceOn ? "bg-amber-500" : "bg-[#083d77]"}`}>
              <Wrench className="h-5 w-5 text-white"/>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Modo Mantenimiento</h3>
              <p className="text-xs text-slate-400">Oculta la página pública y muestra un aviso de mantenimiento</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleMaintenanceToggle}
            disabled={maintenanceLoading || maintenanceSaving}
            className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${maintenanceOn ? "bg-amber-500" : "bg-slate-200"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${maintenanceOn ? "translate-x-5" : "translate-x-0.5"}`}/>
          </button>
        </div>
        {maintenanceOn && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-100 p-3 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/>
            <span>El sitio público está en mantenimiento. Los usuarios verán la página de aviso. El panel de administración sigue accesible.</span>
          </div>
        )}
      </motion.div>

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
        </motion.div>
      </div>
    </div>
  );
}
