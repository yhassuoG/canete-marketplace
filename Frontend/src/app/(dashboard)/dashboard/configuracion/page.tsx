"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { getAuthUser } from "@/lib/auth";
import { fetchTenant, updateTenantConfig, uploadTenantBanner, uploadTenantLogo } from "@/lib/api";
import { getApiBase } from "@/lib/api-base";

const MapPicker = dynamic(() => import("@/components/dashboard/map-picker"), { ssr: false });
import { motion } from "framer-motion";
import { Settings, Bell, Shield, Save, Palette, Store, Loader2, ImagePlus, Upload, X, CreditCard, Banknote, Smartphone, Wallet } from "lucide-react";

const API_BASE = getApiBase();

export default function ConfiguracionPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [notif, setNotif]   = useState({ newReservation: true, newOrder: true, newReview: true, dailySummary: true, weeklySummary: false, lowStock: true });
  const [payMethods, setPayMethods] = useState({ yape: false, plin: false, cash: true, card: false });
  const [theme, setTheme]   = useState({ primary: "#0c4a6e", accent: "#f97316", radius: "rounded" });
  const [info, setInfo]     = useState({
    name: "", tagline: "", address: "", phone: "", description: "",
    lat: "-13.0750", lng: "-76.4610",
  });

  const tenantSlugRef = useRef("");
  const infoRef       = useRef(info);
  useEffect(() => { infoRef.current = info; }, [info]);

  // 1️⃣ On mount: fetch from API (authoritative), fallback to localStorage
  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) return;
    const slug = user.tenantSlug;
    tenantSlugRef.current = slug;

    fetchTenant(slug).then(apiData => {
      if (apiData) {
        setInfo(p => ({
          ...p,
          name:        apiData.name        ?? p.name,
          tagline:     apiData.tagline     ?? p.tagline,
          description: apiData.description ?? p.description,
          phone:       apiData.phone       ?? p.phone,
          address:     apiData.address     ?? p.address,
          lat:         apiData.lat  != null ? String(apiData.lat)  : p.lat,
          lng:         apiData.lng  != null ? String(apiData.lng)  : p.lng,
        }));
        // Cargar banner del API si existe
        if (apiData.bannerUrl) {
          const url = apiData.bannerUrl;
          setBannerUrl(url.startsWith("http") ? url : `${API_BASE}${url}`);
        }
        // Cargar logo del API si existe
        if (apiData.logoUrl) {
          const url = apiData.logoUrl;
          setLogoUrl(url.startsWith("http") ? url : `${API_BASE}${url}`);
        }
        // Cargar métodos de pago configurados
        setPayMethods({
          yape: apiData.yapeEnabled ?? false,
          plin: apiData.plinEnabled ?? false,
          cash: apiData.cashEnabled ?? true,
          card: apiData.cardEnabled ?? false,
        });
        // Update localStorage cache so storefront can read it even if API is down
        localStorage.setItem(`coords_${slug}`, JSON.stringify({
          lat:  apiData.lat  ?? -13.0750,
          lng:  apiData.lng  ?? -76.4610,
          address: apiData.address ?? "",
          name: apiData.name, phone: apiData.phone,
        }));
      } else {
        // API unavailable → try localStorage cache
        const raw = localStorage.getItem(`coords_${slug}`);
        if (raw) {
          try { setInfo(p => ({ ...p, ...JSON.parse(raw) })); } catch { /* ignore */ }
        }
      }
    });
  }, []);

  // Subir imagen de portada al backend
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slug = tenantSlugRef.current;
    if (!slug) return;

    setUploading(true);
    const url = await uploadTenantBanner(slug, file);
    setUploading(false);

    if (url) {
      // El backend guarda la imagen en /uploads/tenants/{slug}/banner.{ext}
      // La URL que devuelve es relativa (/uploads/...), hay que prefixar el API_BASE
      setBannerUrl(url.startsWith("http") ? url : `${API_BASE}${url}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert("No se pudo subir la imagen. Verifica que el backend esté corriendo.");
    }

    // Reset input para poder subir el mismo archivo otra vez
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBannerRemove = async () => {
    const slug = tenantSlugRef.current;
    if (!slug) return;
    setSaving(true);
    await updateTenantConfig(slug, { bannerUrl: "" });
    setSaving(false);
    setBannerUrl(null);
  };

  // Subir logo (imagen de perfil circular) al backend
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const slug = tenantSlugRef.current;
    if (!slug) return;

    setUploadingLogo(true);
    const url = await uploadTenantLogo(slug, file);
    setUploadingLogo(false);

    if (url) {
      setLogoUrl(url.startsWith("http") ? url : `${API_BASE}${url}`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      alert("No se pudo subir el logo. Verifica que el backend esté corriendo.");
    }

    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleLogoRemove = async () => {
    const slug = tenantSlugRef.current;
    if (!slug) return;
    setSaving(true);
    await updateTenantConfig(slug, { logoUrl: "" });
    setSaving(false);
    setLogoUrl(null);
  };

  // 2️⃣ Save: call API first, then persist to localStorage as cache
  const save = async () => {
    setSaving(true);
    const slug = tenantSlugRef.current;
    const cur  = infoRef.current;

    const result = slug
      ? await updateTenantConfig(slug, {
          name:        cur.name,
          tagline:     cur.tagline,
          description: cur.description,
          phone:       cur.phone,
          address:     cur.address,
          lat:         cur.lat,
          lng:         cur.lng,
          yapeEnabled: payMethods.yape,
          plinEnabled: payMethods.plin,
          cashEnabled: payMethods.cash,
          cardEnabled: payMethods.card,
        })
      : null;

    // Also keep localStorage in sync (used by storefront as fallback)
    if (slug) {
      localStorage.setItem(`coords_${slug}`, JSON.stringify({
        lat: cur.lat, lng: cur.lng,
        address: cur.address, name: cur.name, phone: cur.phone,
      }));
    }

    setSaving(false);
    setSaved(true);
    if (!result) console.warn("API unavailable — changes saved only to localStorage");
    setTimeout(() => setSaved(false), 2500);
  };

  const Toggle = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: () => void }) => (
    <div className="flex items-center justify-between py-3">
      <div><p className="text-sm font-medium text-ink">{label}</p>{desc && <p className="text-xs text-slate-400">{desc}</p>}</div>
      <button onClick={onChange} className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-[#0c4a6e]" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}/>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-2"><Settings className="h-5 w-5 text-[#0c4a6e]"/>
          <div><h1 className="text-lg font-semibold text-ink">Configuración</h1><p className="text-sm text-slate-400">Ajustes de tu cuenta y negocio</p></div>
        </div>
        <button onClick={save} disabled={saving}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${saved ? "bg-emerald-500" : "bg-[#0c4a6e]"}`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
          {saving ? "Guardando…" : saved ? "¡Guardado!" : "Guardar"}
        </button>
      </header>

      <div className="p-4 sm:p-6 grid gap-6 lg:grid-cols-2">
        {/* Payment methods */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 mb-2"><Wallet className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Métodos de pago</h3></div>
          <p className="text-sm text-slate-400 mb-5">Activa o desactiva los métodos de pago que aceptas en tu tienda. Los cambios se reflejan inmediatamente en tu tienda pública.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Efectivo */}
            <div className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${payMethods.cash ? "border-emerald-200 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payMethods.cash ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                  <Banknote className="h-5 w-5"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Efectivo</p>
                  <p className="text-xs text-slate-400">Pago en entrega</p>
                </div>
              </div>
              <button onClick={() => setPayMethods(p => ({ ...p, cash: !p.cash }))} className={`relative h-6 w-11 rounded-full transition-colors ${payMethods.cash ? "bg-emerald-500" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${payMethods.cash ? "translate-x-5" : "translate-x-0.5"}`}/>
              </button>
            </div>

            {/* Yape */}
            <div className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${payMethods.yape ? "border-purple-200 bg-purple-50/40" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payMethods.yape ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-400"}`}>
                  <Smartphone className="h-5 w-5"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Yape</p>
                  <p className="text-xs text-slate-400">Transferencia con QR</p>
                </div>
              </div>
              <button onClick={() => setPayMethods(p => ({ ...p, yape: !p.yape }))} className={`relative h-6 w-11 rounded-full transition-colors ${payMethods.yape ? "bg-purple-500" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${payMethods.yape ? "translate-x-5" : "translate-x-0.5"}`}/>
              </button>
            </div>

            {/* Plin */}
            <div className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${payMethods.plin ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payMethods.plin ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`}>
                  <Smartphone className="h-5 w-5"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Plin</p>
                  <p className="text-xs text-slate-400">Transferencia interbancaria</p>
                </div>
              </div>
              <button onClick={() => setPayMethods(p => ({ ...p, plin: !p.plin }))} className={`relative h-6 w-11 rounded-full transition-colors ${payMethods.plin ? "bg-blue-500" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${payMethods.plin ? "translate-x-5" : "translate-x-0.5"}`}/>
              </button>
            </div>

            {/* Tarjeta */}
            <div className={`flex items-center justify-between rounded-2xl border p-4 transition-colors ${payMethods.card ? "border-[#0c4a6e]/20 bg-[#0c4a6e]/5" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${payMethods.card ? "bg-[#0c4a6e]/10 text-[#0c4a6e]" : "bg-slate-100 text-slate-400"}`}>
                  <CreditCard className="h-5 w-5"/>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Tarjeta</p>
                  <p className="text-xs text-slate-400">Vía Mercado Pago</p>
                </div>
              </div>
              <button onClick={() => setPayMethods(p => ({ ...p, card: !p.card }))} className={`relative h-6 w-11 rounded-full transition-colors ${payMethods.card ? "bg-[#0c4a6e]" : "bg-slate-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${payMethods.card ? "translate-x-5" : "translate-x-0.5"}`}/>
              </button>
            </div>
          </div>
          {(!payMethods.cash && !payMethods.yape && !payMethods.plin && !payMethods.card) && (
            <p className="mt-3 text-xs text-amber-600 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5"/>
              Debes tener al menos un método de pago activo para recibir pedidos.
            </p>
          )}
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4"><Bell className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Notificaciones</h3></div>
          <div className="divide-y divide-slate-50">
            <Toggle label="Nueva reserva" desc="Recibe una alerta por cada nueva reserva" checked={notif.newReservation} onChange={() => setNotif(p => ({ ...p, newReservation: !p.newReservation }))}/>
            <Toggle label="Nuevo pedido delivery" desc="Alerta cuando entra un pedido" checked={notif.newOrder} onChange={() => setNotif(p => ({ ...p, newOrder: !p.newOrder }))}/>
            <Toggle label="Nueva reseña" desc="Cuando un cliente deja una opinión" checked={notif.newReview} onChange={() => setNotif(p => ({ ...p, newReview: !p.newReview }))}/>
            <Toggle label="Resumen diario" desc="Email con el resumen del día" checked={notif.dailySummary} onChange={() => setNotif(p => ({ ...p, dailySummary: !p.dailySummary }))}/>
            <Toggle label="Resumen semanal" desc="Email cada lunes con la semana" checked={notif.weeklySummary} onChange={() => setNotif(p => ({ ...p, weeklySummary: !p.weeklySummary }))}/>
          </div>
        </motion.div>

        {/* Logo circular */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><Store className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Logo de la tienda</h3></div>
          <p className="text-sm text-slate-400 mb-4">Sube una imagen cuadrada que se mostrará como logo circular en tu tienda (tipo foto de perfil). Formatos: PNG, JPG. Máx 5MB.</p>

          <div className="grid gap-4 sm:grid-cols-[120px_1fr] items-start">
            {/* Preview circular */}
            <div className="relative mx-auto h-28 w-28">
              {logoUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl} alt="Logo" className="h-28 w-28 rounded-full border-4 border-slate-200 object-cover"/>
                  <button
                    onClick={handleLogoRemove}
                    disabled={saving}
                    className="absolute -top-1 -right-1 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                    title="Quitar logo"
                  >
                    <X className="h-3.5 w-3.5"/>
                  </button>
                </>
              ) : (
                <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-full border-4 border-dashed border-slate-300 bg-slate-50 text-slate-300">
                  <Store className="h-7 w-7"/>
                  <span className="text-[10px]">Sin logo</span>
                </div>
              )}
            </div>

            {/* Upload button + info */}
            <div className="flex flex-col gap-3">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-medium text-slate-600 transition-colors hover:border-[#0c4a6e] hover:text-[#0c4a6e] disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <><Loader2 className="h-5 w-5 animate-spin"/> Subiendo…</>
                ) : (
                  <><Upload className="h-5 w-5"/> {logoUrl ? "Cambiar logo" : "Subir logo"}</>
                )}
              </button>
              <p className="text-xs text-slate-400">
                Se recomienda una imagen cuadrada de al menos 256×256px. Se mostrará recortada en círculo.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Imagen de portada / banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><ImagePlus className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Imagen de portada</h3></div>
          <p className="text-sm text-slate-400 mb-4">Sube una imagen que se mostrará como banner principal en tu tienda. Formatos: PNG, JPG. Máx 10MB.</p>

          <div className="grid gap-4 sm:grid-cols-[200px_1fr] items-start">
            {/* Preview */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              {bannerUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerUrl} alt="Portada" className="h-full w-full object-cover"/>
                  <button
                    onClick={handleBannerRemove}
                    disabled={saving}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors disabled:opacity-50"
                    title="Quitar imagen"
                  >
                    <X className="h-4 w-4"/>
                  </button>
                </>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-300">
                  <ImagePlus className="h-8 w-8"/>
                  <span className="text-xs">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Upload button + info */}
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleBannerUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-6 text-sm font-medium text-slate-600 transition-colors hover:border-[#0c4a6e] hover:text-[#0c4a6e] disabled:opacity-50"
              >
                {uploading ? (
                  <><Loader2 className="h-5 w-5 animate-spin"/> Subiendo…</>
                ) : (
                  <><Upload className="h-5 w-5"/> {bannerUrl ? "Cambiar imagen" : "Subir imagen"}</>
                )}
              </button>
              <p className="text-xs text-slate-400">
                La imagen se recorta automáticamente al formato 16:9. Se recomienda una resolución mínima de 1280×720px.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4"><Palette className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Apariencia de la tienda</h3></div>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Color primario</label>
              <div className="flex items-center gap-3">
                <input type="color" value={theme.primary} onChange={e => setTheme(p => ({ ...p, primary: e.target.value }))}
                  className="h-10 w-16 rounded-xl cursor-pointer border border-slate-200"/>
                <span className="font-mono text-sm text-slate-500">{theme.primary}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Color de acento</label>
              <div className="flex items-center gap-3">
                <input type="color" value={theme.accent} onChange={e => setTheme(p => ({ ...p, accent: e.target.value }))}
                  className="h-10 w-16 rounded-xl cursor-pointer border border-slate-200"/>
                <span className="font-mono text-sm text-slate-500">{theme.accent}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">Estilo de bordes</label>
              <div className="flex gap-2">
                {(["sharp", "rounded", "pill"] as const).map(r => (
                  <button key={r} onClick={() => setTheme(p => ({ ...p, radius: r }))}
                    className={`flex-1 rounded-xl py-2 text-sm font-medium border transition-all ${theme.radius === r ? "border-[#0c4a6e] bg-[#0c4a6e] text-white" : "border-slate-200 text-slate-500"}`}>
                    {r === "sharp" ? "Angular" : r === "rounded" ? "Redondeado" : "Píldora"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Store Info */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center gap-2 mb-5"><Store className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Información del negocio</h3></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre del negocio</label>
              <input value={info.name} onChange={e => setInfo(p => ({ ...p, name: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Teléfono / WhatsApp</label>
              <input value={info.phone} onChange={e => setInfo(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Tagline (slogan corto)</label>
              <input value={info.tagline ?? ""} onChange={e => setInfo(p => ({ ...p, tagline: e.target.value }))} placeholder="Ej: El mejor ceviche de Cañete" className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Dirección física</label>
              <input value={info.address} onChange={e => setInfo(p => ({ ...p, address: e.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripción corta</label>
              <textarea value={info.description} onChange={e => setInfo(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20 resize-none"/>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-3">Ubicación en el mapa</label>
              <MapPicker
                lat={info.lat}
                lng={info.lng}
                onChange={(lat, lng, address) =>
                  setInfo(p => ({
                    ...p,
                    lat,
                    lng,
                    ...(address ? { address } : {}),
                  }))
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-2 mb-4"><Shield className="h-4 w-4 text-[#0c4a6e]"/><h3 className="font-semibold text-ink">Seguridad de la cuenta</h3></div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email de la cuenta</label>
              <input type="email" defaultValue="admin@muellepacifico.com" className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Nueva contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"/>
            </div>
            <button className="w-full rounded-2xl border border-[#0c4a6e] py-2.5 text-sm font-semibold text-[#0c4a6e] hover:bg-[#0c4a6e]/5 transition-colors">
              Activar autenticación 2FA
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
