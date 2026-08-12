"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  Heart,
  Share2,
  ShoppingCart,
  CalendarCheck,
  Truck,
  Verified,
  ChevronRight,
  X,
  Users,
  CheckCircle2,
  Package,
  CreditCard,
  Banknote,
  Bike,
  Plus,
  Minus,
  Trash2,
} from "lucide-react";
import type { Tenant, Product } from "@/lib/types";
import { TenantSubscribeButton } from "@/components/tenant/tenant-subscribe-button";
import { createOrder, createPaymentPreference, fetchProducts as fetchProductsApi, Product as ApiProduct } from "@/lib/api";

const StorefrontLeafletMap = dynamic(
  () => import("@/components/tenant/storefront-leaflet-map"),
  { ssr: false, loading: () => <div className="h-full animate-pulse rounded-3xl bg-slate-100" /> }
);

// ── Tenant geo coords — fallback estático ─────────────────────────────────────
const TENANT_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "muelle-pacifico":    { lat: -13.0750, lng: -76.4610, zoom: 16 },
  "paraiso-lunahuana":  { lat: -12.9780, lng: -76.0670, zoom: 15 },
  "vina-del-sol":       { lat: -12.9820, lng: -76.0720, zoom: 15 },
  "hotel-luna":         { lat: -13.0700, lng: -76.4580, zoom: 16 },
};

function TenantMap({
  slug, name, primaryColor,
  apiLat, apiLng,
}: {
  slug: string; name: string; primaryColor?: string;
  apiLat?: number | null; apiLng?: number | null;
}) {
  const fallback = TENANT_COORDS[slug] ?? { lat: -13.075, lng: -76.461, zoom: 15 };

  // Priority: 1) DB/API coords, 2) localStorage cache, 3) hardcoded fallback
  const [coords, setCoords] = useState(() => ({
    lat: (apiLat != null && !isNaN(apiLat)) ? apiLat : fallback.lat,
    lng: (apiLng != null && !isNaN(apiLng)) ? apiLng : fallback.lng,
    zoom: fallback.zoom,
  }));

  useEffect(() => {
    // If API already provided valid coords, no need to read localStorage
    if (apiLat != null && !isNaN(apiLat) && apiLng != null && !isNaN(apiLng)) return;
    const raw = localStorage.getItem(`coords_${slug}`);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      const lat = parseFloat(saved.lat);
      const lng = parseFloat(saved.lng);
      if (!isNaN(lat) && !isNaN(lng)) setCoords({ lat, lng, zoom: fallback.zoom });
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, apiLat, apiLng]);

  const gmapsDirections = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  const gmapsView       = `https://maps.google.com/?q=${coords.lat},${coords.lng}`;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-[var(--tenant-border)] shadow-sm" style={{ height: 280 }}>
        <StorefrontLeafletMap
          key={`map-${Math.round(coords.lat * 10000)}-${Math.round(coords.lng * 10000)}`}
          lat={coords.lat}
          lng={coords.lng}
          primaryColor={primaryColor}
        />
      </div>

      {/* Directions bar */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={gmapsDirections}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white transition active:scale-95"
          style={{ background: "var(--tenant-primary)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Cómo llegar
        </a>
        <a
          href={gmapsView}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--tenant-border)] py-3 text-sm font-semibold text-[var(--tenant-primary)] transition hover:bg-[var(--tenant-primary)]/5 active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          Ver en Google Maps
        </a>
      </div>
    </div>
  );
}

// ── Order Modal ───────────────────────────────────────────────────────────────
type OrderForm = {
  name: string; phone: string; type: "pickup" | "delivery";
  address: string; payment: string; notes: string;
  paymentReference: string;
};

function OrderModal({
  tenant, lines, total, onClose,
}: {
  tenant: Tenant;
  lines: { product: Product; qty: number }[];
  total: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"form" | "yape" | "confirm" | "error">("form");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OrderForm>(() => {
    // Default delivery type based on tenant config
    const allowsDelivery = tenant.allowsDelivery ?? true;
    const allowsPickup = tenant.allowsPickup ?? true;
    const defaultType: "pickup" | "delivery" = !allowsPickup && allowsDelivery
      ? "delivery"
      : "pickup";
    return {
      name: "", phone: "", type: defaultType, address: "",
      payment: "efectivo", notes: "", paymentReference: "",
    };
  });
  const [orderId, setOrderId] = useState<string>("");

  const set = (k: keyof OrderForm, v: string) => setForm(p => ({ ...p, [k]: v }));

  // Delivery / pickup options filtered by tenant config
  const allowsDelivery = tenant.allowsDelivery ?? true;
  const allowsPickup = tenant.allowsPickup ?? true;
  const deliveryOptions: ("pickup" | "delivery")[] = [
    ...(allowsPickup ? ["pickup" as const] : []),
    ...(allowsDelivery ? ["delivery" as const] : []),
  ];

  // Delivery fee from tenant config (fallback 5)
  const deliveryFee = tenant.deliveryFee != null ? Number(tenant.deliveryFee) : 5;
  const grandTotal = form.type === "delivery" ? total + deliveryFee : total;

  // Whether the selected payment requires a confirmation step (Yape/Plin)
  const needsPaymentRef = form.payment === "yape" || form.payment === "plin";
  const paymentLabel =
    form.payment === "yape" ? "Yape"
    : form.payment === "plin" ? "Plin"
    : form.payment;

  const doCreateOrder = async () => {
    setSubmitting(true);

    // Para Yape/Plin usamos Mercado Pago (pasarela automática)
    // Para efectivo, flujo directo sin pasarela
    const usingMercadoPago = needsPaymentRef;

    const created = await createOrder({
      tenantId: tenant.id,
      customerName: form.name,
      customerPhone: form.phone,
      customerAddress: form.type === "delivery" ? form.address : undefined,
      deliveryType: form.type,
      paymentMethod: usingMercadoPago ? "mercadopago" : form.payment,
      paymentReference: undefined, // MP gestiona la referencia
      notes: form.notes || undefined,
      items: lines.map(({ product: i, qty }) => ({
        productId: i.id, name: i.name, price: i.price, qty,
      })),
    });

    if (!created) {
      setSubmitting(false);
      setStep("error");
      return;
    }

    // Si es Yape/Plin → crear preferencia en MP y redirigir
    if (usingMercadoPago) {
      const pref = await createPaymentPreference(created.id);
      setSubmitting(false);
      if (pref?.initPoint) {
        // Redirigir al checkout de Mercado Pago
        window.location.href = pref.initPoint;
        return;
      }
      // Si falla la preferencia, mostrar error
      setStep("error");
      return;
    }

    // Efectivo → confirmación directa
    setSubmitting(false);
    setOrderId(created.id);
    setStep("confirm");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.type === "delivery" && !form.address.trim()) return;

    // If Yape/Plin, go to payment confirmation step first
    if (needsPaymentRef) {
      setStep("yape");
      return;
    }

    await doCreateOrder();
  };

  const PAYMENTS = [
    { id: "yape",     label: "Yape",      icon: CreditCard },
    { id: "plin",     label: "Plin",      icon: CreditCard },
    { id: "efectivo", label: "Efectivo",  icon: Banknote   },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 28 }}
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">

        {step === "form" ? (
          <form onSubmit={submit}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" style={{ color: "var(--tenant-primary)" }}/>
                <h2 className="font-bold text-ink">Datos del pedido</h2>
              </div>
              <button type="button" onClick={onClose}><X className="h-5 w-5 text-slate-400"/></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* Order summary */}
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                {lines.map(({ product: i, qty }) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{qty} × {i.name}</span>
                    <span className="font-semibold">S/{(i.price * qty).toFixed(2)}</span>
                  </div>
                ))}
                {form.type === "delivery" && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Delivery</span>
                    <span className="font-medium text-slate-600">S/{deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-2">
                  <span>Total</span><span>S/{grandTotal}</span>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tus datos</p>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre completo *</label>
                  <input required value={form.name} onChange={e => set("name", e.target.value)}
                    placeholder="Tu nombre" className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono / WhatsApp *</label>
                  <input required type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                    placeholder="+51 9xx xxx xxx" className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
              </div>

              {/* Delivery type */}
              {deliveryOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo de entrega</p>
                <div className={`grid gap-2 ${deliveryOptions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                  {deliveryOptions.map(t => (
                    <button key={t} type="button" onClick={() => set("type", t)}
                      className={`flex items-center justify-center gap-2 rounded-2xl border py-3 text-sm font-medium transition-all ${
                        form.type === t
                          ? "border-transparent text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      style={form.type === t ? { background: "var(--tenant-gradient)" } : {}}>
                      {t === "pickup" ? <Package className="h-4 w-4"/> : <Bike className="h-4 w-4"/>}
                      {t === "pickup"
                        ? "Recojo en local"
                        : deliveryFee > 0 ? `Delivery (S/${deliveryFee})` : "Delivery"}
                    </button>
                  ))}
                </div>
                {form.type === "delivery" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Dirección de entrega *</label>
                    <input required value={form.address} onChange={e => set("address", e.target.value)}
                      placeholder="Calle, número, referencia"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                  </div>
                )}
              </div>
              )}

              {/* Payment */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Método de pago</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENTS.map(({ id, label, icon: Icon }) => (
                    <button key={id} type="button" onClick={() => set("payment", id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-medium transition-all ${
                        form.payment === id
                          ? "border-transparent text-white"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                      style={form.payment === id ? { background: "var(--tenant-gradient)" } : {}}>
                      <Icon className="h-4 w-4"/>{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notas adicionales</label>
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  placeholder="Sin cebolla, picante extra…" rows={2}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20 resize-none"/>
              </div>
            </div>

            <div className="border-t px-6 pb-6 pt-4">
              <button type="submit" disabled={submitting}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{ background: "var(--tenant-gradient)" }}>
                {submitting
                  ? "Procesando…"
                  : needsPaymentRef ? `Pagar con ${paymentLabel} →` : `Confirmar pedido · S/${grandTotal}`}
              </button>
            </div>
          </form>
        ) : step === "yape" ? (
          /* Yape / Plin confirmation step */
          <form onSubmit={async (e) => { e.preventDefault(); await doCreateOrder(); }}>
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" style={{ color: "var(--tenant-primary)" }}/>
                <h2 className="font-bold text-ink">Pago con {paymentLabel}</h2>
              </div>
              <button type="button" onClick={() => setStep("form")}><X className="h-5 w-5 text-slate-400"/></button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
              {/* Info banner — Mercado Pago gestiona el pago */}
              <div className="rounded-2xl border-2 border-dashed border-slate-200 p-5 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                  <CreditCard className="h-6 w-6 text-emerald-500"/>
                </div>
                <p className="text-sm font-semibold text-ink">
                  Pago seguro con Mercado Pago
                </p>
                <p className="text-xs text-slate-500">
                  Serás redirigido a Mercado Pago para completar el pago de{" "}
                  <span className="font-bold">S/{grandTotal}</span> usando {paymentLabel}.
                  La confirmación es automática.
                </p>
              </div>

              {/* Order recap */}
              <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Cliente</span><span className="font-medium">{form.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Teléfono</span><span className="font-medium">{form.phone}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Entrega</span><span className="font-medium">{form.type === "pickup" ? "Recojo en local" : form.address}</span></div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1"><span>Total a pagar</span><span>S/{grandTotal}</span></div>
              </div>
            </div>

            <div className="border-t px-6 pb-6 pt-4">
              <button type="submit" disabled={submitting}
                className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
                style={{ background: "var(--tenant-gradient)" }}>
                {submitting ? "Redirigiendo a Mercado Pago…" : `Pagar S/${grandTotal} con ${paymentLabel} →`}
              </button>
            </div>
          </form>
        ) : step === "error" ? (
          /* Error screen */
          <div className="px-6 py-8 text-center">
            <button className="absolute right-5 top-5 text-slate-400 hover:text-slate-600" onClick={onClose}>
              <X className="h-5 w-5"/>
            </button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <X className="h-10 w-10 text-red-500"/>
            </motion.div>
            <h2 className="text-2xl font-bold text-ink mb-1">No se pudo enviar</h2>
            <p className="text-sm text-slate-400 mb-6">Hubo un problema al registrar tu pedido. Verifica tu conexión e inténtalo nuevamente.</p>
            <button onClick={() => setStep("form")}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{ background: "var(--tenant-gradient)" }}>
              Volver al formulario
            </button>
          </div>
        ) : (
          /* Confirmation screen */
          <div className="px-6 py-8 text-center">
            <button className="absolute right-5 top-5 text-slate-400 hover:text-slate-600" onClick={onClose}>
              <X className="h-5 w-5"/>
            </button>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-500"/>
            </motion.div>
            <h2 className="text-2xl font-bold text-ink mb-1">¡Pedido recibido!</h2>
            <p className="text-sm text-slate-400 mb-5">Número de orden: <span className="font-mono font-semibold text-slate-700">{orderId.slice(0, 8).toUpperCase()}</span></p>

            <div className="rounded-2xl bg-slate-50 p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Cliente</span><span className="font-medium">{form.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Teléfono</span><span className="font-medium">{form.phone}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Entrega</span><span className="font-medium">{form.type === "pickup" ? "Recojo en local" : form.address}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Pago</span><span className="font-medium capitalize">{form.payment}</span></div>
              {form.paymentReference && (
                <div className="flex justify-between text-sm"><span className="text-slate-500">Cód. operación</span><span className="font-mono font-medium">{form.paymentReference}</span></div>
              )}
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2 mt-1"><span>Total</span><span>S/{grandTotal}</span></div>
            </div>

            <p className="text-xs text-slate-400 mb-6">Te enviaremos una confirmación por WhatsApp al {form.phone}.</p>

            <button onClick={onClose}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white"
              style={{ background: "var(--tenant-gradient)" }}>
              Perfecto, gracias
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Reservation modal ──────────────────────────────────────────────────────────
function ReservationModal({ tenant, onClose }: { tenant: Tenant; onClose: () => void }) {
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [form, setForm] = useState({ name: "", phone: "", guests: "2", date: "", time: "", notes: "" });
  const TIMES = ["12:00", "13:00", "13:30", "14:00", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"];

  const submit = (e: React.FormEvent) => { e.preventDefault(); setStep("confirm"); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ type: "spring", damping: 28 }}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <button onClick={onClose} className="absolute right-5 top-5 text-slate-400 hover:text-slate-600"><X className="h-5 w-5"/></button>

        {step === "form" ? (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white text-lg" style={{ background: tenant.theme.gradient }}>{tenant.name[0]}</div>
              <div><h2 className="font-bold text-ink">Reservar en {tenant.name}</h2><p className="text-xs text-slate-400">Confirmación inmediata</p></div>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Nombre completo</label>
                  <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Tu nombre"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Teléfono</label>
                  <input required type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+51 9xx xxx xxx"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Personas</label>
                  <select value={form.guests} onChange={e => setForm(p => ({ ...p, guests: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20">
                    {[1,2,3,4,5,6,7,8,10,12].map(n => <option key={n} value={n}>{n} {n === 1 ? "persona" : "personas"}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Fecha</label>
                  <input required type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
                  <select required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20">
                    <option value="">Seleccionar</option>
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Notas (opcional)</label>
                  <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Alergias, ocasión especial..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary)]/20"/>
                </div>
              </div>
              <button type="submit" className="w-full rounded-2xl py-3 text-sm font-bold text-white" style={{ background: "var(--tenant-gradient)" }}>
                Confirmar reserva →
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14 }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500"/>
            </motion.div>
            <h2 className="text-xl font-bold text-ink mb-2">¡Reserva confirmada!</h2>
            <p className="text-slate-500 text-sm mb-1">{tenant.name}</p>
            <p className="text-slate-500 text-sm">{form.date} · {form.time} · {form.guests} personas</p>
            <p className="mt-3 text-sm font-medium text-ink">{form.name}</p>
            <p className="text-xs text-slate-400">Recibirás un SMS de confirmación en {form.phone}</p>
            <button onClick={onClose} className="mt-6 w-full rounded-2xl py-3 text-sm font-bold text-white" style={{ background: "var(--tenant-gradient)" }}>
              Perfecto, gracias
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const BADGE_STYLES = {
  popular: "bg-amber-100 text-amber-700",
  new: "bg-emerald-100 text-emerald-700",
  offer: "bg-red-100 text-red-700",
};
const BADGE_LABELS = { popular: "⭐ Popular", new: "✨ Nuevo", offer: "🔥 Oferta" };

// ── Component ─────────────────────────────────────────────────────────────────

interface TenantStorefrontProps {
  tenant: Tenant;
}

export function TenantStorefront({ tenant }: TenantStorefrontProps) {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  const { theme } = tenant;

  // Load real products from API
  useEffect(() => {
    setProductsLoading(true);
    fetchProductsApi(tenant.slug).then((data) => {
      if (!data) {
        setProducts([]);
      } else {
        const mapped: Product[] = data
          .filter((p) => p.available)
          .map((p: ApiProduct) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            price: p.price,
            category: p.category ?? "General",
            rating: 4.5,
            reviewCount: 0,
            available: p.available,
          }));
        setProducts(mapped);
      }
      setProductsLoading(false);
    });
  }, [tenant.slug]);

  const CATEGORIES = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts =
    activeCategory === "Todos"
      ? products
      : products.filter((p) => p.category === activeCategory);

  const cartItems = products.filter((p) => cart[p.id] != null && cart[p.id] > 0);
  const cartCount = Object.values(cart).reduce((acc, q) => acc + q, 0);
  const cartTotal = cartItems.reduce((acc, p) => acc + p.price * (cart[p.id] ?? 1), 0);

  const addToCart = (id: string) => setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  const decFromCart = (id: string) =>
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) - 1 };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  const removeFromCart = (id: string) =>
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  return (
    <div className="min-h-screen" style={{ background: "var(--tenant-bg)" }}>
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative h-[480px] overflow-hidden md:h-[520px]">
        {/* Background */}
        {theme.heroImage ? (
          <>
            {/* Fondo oscuro detrás del banner (para áreas vacías en contain) */}
            <div className="absolute inset-0" style={{ background: theme.gradient }} />
            {/* Banner con object-contain: se ve completo, sin recortar ni distorsionar */}
            <img
              src={theme.heroImage}
              alt={`${tenant.name} banner`}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: theme.gradient }} />
        )}

        {/* Overlay degradado para legibilidad sobre banner claro */}
        {theme.heroImage && (
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.05) 55%, rgba(0,0,0,0.5) 100%)",
            }}
          />
        )}

        {/* Nav */}
        <nav className="relative flex items-center justify-between px-6 py-5">
          <Link href="/" className="glass-dark rounded-2xl px-4 py-2 transition hover:bg-white/20">
            <p className="text-xs uppercase tracking-widest text-white/60">vallecanete</p>
          </Link>
          <div className="flex gap-2">
            <TenantSubscribeButton
              tenantSlug={tenant.slug}
              primaryColor={tenant.theme.primary}
            />
            <button
              onClick={() => setLiked((v) => !v)}
              className="glass-dark flex h-10 w-10 items-center justify-center rounded-full"
            >
              <Heart
                className={`h-4 w-4 ${liked ? "fill-red-400 text-red-400" : "text-white"}`}
              />
            </button>
            <button className="glass-dark flex h-10 w-10 items-center justify-center rounded-full">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative flex h-full flex-col justify-end px-6 pb-10 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: "var(--tenant-accent)" }}
              >
                {tenant.category}
              </span>
              {tenant.status === "active" && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Abierto ahora
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Logo circular (tipo foto de perfil de Facebook) */}
              {tenant.logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={tenant.logoUrl}
                  alt={`${tenant.name} logo`}
                  className="h-20 w-20 shrink-0 rounded-full border-4 border-white/80 object-cover shadow-lg md:h-24 md:w-24"
                />
              ) : (
                <div
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/80 text-2xl font-bold text-white shadow-lg md:h-24 md:w-24"
                  style={{ background: "var(--tenant-accent)" }}
                >
                  {tenant.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white md:text-5xl">
                  {tenant.name}
                  <Verified className="ml-2 inline-block h-6 w-6 text-blue-400" />
                </h1>
                <p className="mt-1 text-lg text-white/80">{tenant.tagline}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/70">
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <strong className="text-white">{tenant.rating}</strong>
                ({tenant.reviewCount} reseñas)
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {tenant.address || tenant.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Lun–Dom · 11:00 – 22:00
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── ACTION BAR ─────────────────────────────────────────────────────── */}
      <section className="sticky top-0 z-10 border-b border-[var(--tenant-border)] bg-[var(--tenant-surface)]/90 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all"
                style={
                  activeCategory === cat
                    ? { background: "var(--tenant-gradient)", color: "#fff" }
                    : { background: "#f1f5f9", color: "#64748b" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            {tenant.features.includes("reservations") && (
              <button
                onClick={() => setReservationOpen(true)}
                className="hidden md:flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--tenant-gradient)" }}
              >
                <CalendarCheck className="h-4 w-4" />
                Reservar
              </button>
            )}
            {tenant.features.includes("delivery") && (
              <button className="hidden md:flex items-center gap-1.5 rounded-xl border border-[var(--tenant-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--tenant-primary)]">
                <Truck className="h-4 w-4" />
                Delivery
              </button>
            )}
            {cartCount > 0 && (
              <button
                onClick={() => setCartOpen(true)}
                className="relative flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                style={{ background: "var(--tenant-accent)" }}
              >
                <ShoppingCart className="h-4 w-4" />
                {cartCount}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── CATALOG ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {productsLoading ? (
              <div className="col-span-full py-16 text-center text-sm text-[var(--tenant-text-muted)]">Cargando productos…</div>
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-sm text-[var(--tenant-text-muted)]">No hay productos disponibles</div>
            ) : filteredProducts.map((product, i) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="group relative overflow-hidden rounded-3xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-5 shadow-sm transition-shadow hover:shadow-soft"
              >
                {product.badge && (
                  <span className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_STYLES[product.badge]}`}>
                    {BADGE_LABELS[product.badge]}
                  </span>
                )}

                <p className="text-xs uppercase tracking-widest text-[var(--tenant-text-muted)]">
                  {product.category}
                </p>
                <h3 className="mt-1 text-base font-semibold text-[var(--tenant-text)]">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--tenant-text-muted)] leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-[var(--tenant-text)]">
                      S/{product.price}
                    </span>
                    <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      {product.rating}
                    </span>
                  </div>
                  <button
                    onClick={() => addToCart(product.id)}
                    className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity"
                    style={{ background: "var(--tenant-gradient)" }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    {cart[product.id] ? `Agregado (${cart[product.id]})` : "Agregar"}
                  </button>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* ── INFO SECTION + MAP ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 pb-16 space-y-6">
        {/* Info */}
        <div className="rounded-3xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] p-6">
          <h3 className="mb-4 font-semibold text-[var(--tenant-text)]">Información</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="flex items-center gap-2 text-sm text-[var(--tenant-text-muted)]">
              <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: "var(--tenant-primary)" }} />
              {tenant.address || tenant.location}
            </p>
            {tenant.phone && (
              <a href={`tel:${tenant.phone}`} className="flex items-center gap-2 text-sm text-[var(--tenant-text-muted)] hover:underline">
                <Phone className="h-4 w-4 flex-shrink-0" style={{ color: "var(--tenant-primary)" }} />
                {tenant.phone}
              </a>
            )}
            <p className="flex items-center gap-2 text-sm text-[var(--tenant-text-muted)]">
              <Clock className="h-4 w-4 flex-shrink-0" style={{ color: "var(--tenant-primary)" }} />
              Lun–Dom · 11:00 – 22:00
            </p>
            <div className="flex gap-2 sm:col-span-2 mt-2">
              {tenant.features.includes("reservations") && (
                <button onClick={() => setReservationOpen(true)}
                  className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white"
                  style={{ background: "var(--tenant-gradient)" }}>
                  <CalendarCheck className="h-4 w-4"/> Reservar mesa
                </button>
              )}
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`}
                  className="flex items-center gap-2 rounded-2xl border border-[var(--tenant-border)] bg-[var(--tenant-surface)] px-5 py-2.5 text-sm font-semibold"
                  style={{ color: "var(--tenant-primary)" }}>
                  <Phone className="h-4 w-4"/> Llamar
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Map */}
        <div>
          <h3 className="mb-3 font-semibold text-[var(--tenant-text)]">Cómo llegar</h3>
          <TenantMap
            slug={tenant.slug}
            name={tenant.name}
            primaryColor={tenant.theme.primary}
            apiLat={tenant.lat}
            apiLng={tenant.lng}
          />
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tenant.name + " " + tenant.location)}`}
            target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--tenant-primary)" }}>
            <MapPin className="h-3.5 w-3.5"/> Ver en Google Maps
          </a>
        </div>
      </section>

      {/* ── FLOATING CART PANEL ────────────────────────────────────────────── */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)} className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"/>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between border-b p-5">
                <h3 className="font-semibold text-ink">Tu pedido</h3>
                <button onClick={() => setCartOpen(false)}><X className="h-5 w-5 text-slate-400"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {cartItems.length === 0 ? (
                  <p className="py-10 text-center text-sm text-slate-400">Tu carrito está vacío</p>
                ) : cartItems.map((item) => {
                  const qty = cart[item.id] ?? 1;
                  return (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.category} · S/{item.price}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-lg border border-slate-200">
                      <button onClick={() => decFromCart(item.id)} className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Minus className="h-3.5 w-3.5"/>
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                      <button onClick={() => addToCart(item.id)} className="flex h-7 w-7 items-center justify-center text-slate-500 hover:bg-slate-50">
                        <Plus className="h-3.5 w-3.5"/>
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-bold">S/{(item.price * qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(item.id)} className="flex h-8 w-8 items-center justify-center text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4"/>
                    </button>
                  </div>
                  );
                })}
              </div>
              <div className="border-t p-5 pb-24 md:pb-5">
                <div className="flex justify-between mb-4"><span className="font-medium">Total</span><span className="font-bold text-lg">S/{cartTotal.toFixed(2)}</span></div>
                <button
                  disabled={cartItems.length === 0}
                  className={`w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity ${
                    cartItems.length === 0 ? "opacity-40 cursor-not-allowed" : ""
                  }`}
                  style={{ background: "var(--tenant-gradient)" }}
                  onClick={() => { if (cartItems.length === 0) return; setCartOpen(false); setOrderOpen(true); }}
                >
                  Realizar pedido →
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ORDER MODAL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {orderOpen && (
          <OrderModal
            tenant={tenant}
            lines={cartItems.map((p) => ({ product: p, qty: cart[p.id] ?? 1 }))}
            total={cartTotal}
            onClose={() => setOrderOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── RESERVATION MODAL ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {reservationOpen && <ReservationModal tenant={tenant} onClose={() => setReservationOpen(false)}/>}
      </AnimatePresence>

      {/* ── MOBILE RESERVATION FAB ─────────────────────────────────────────── */}
      {tenant.features.includes("reservations") && (
        <div className="fixed bottom-20 left-0 right-0 z-30 px-4 md:hidden">
          <button onClick={() => setReservationOpen(true)}
            className="w-full rounded-2xl py-4 text-sm font-bold text-white shadow-lg"
            style={{ background: "var(--tenant-gradient)" }}>
            <CalendarCheck className="inline-block h-4 w-4 mr-2"/>
            Reservar mesa
          </button>
        </div>
      )}
    </div>
  );
}
