"use client";

import { useState, useEffect, useRef } from "react";
import { getAuthUser } from "@/lib/auth";
import {
  fetchTenant,
  updateTenantConfig,
  uploadYapeQr,
  uploadPlinQr,
  type TenantApiData,
} from "@/lib/api";
import { motion } from "framer-motion";
import {
  Smartphone,
  Save,
  Loader2,
  CheckCircle2,
  Upload,
  Trash2,
  CreditCard,
} from "lucide-react";

export default function YapePlinConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Yape
  const [yapeEnabled, setYapeEnabled] = useState(false);
  const [yapePhone, setYapePhone] = useState("");
  const [yapeHolder, setYapeHolder] = useState("");
  const [yapeQrUrl, setYapeQrUrl] = useState<string | null>(null);

  // Plin
  const [plinEnabled, setPlinEnabled] = useState(false);
  const [plinPhone, setPlinPhone] = useState("");
  const [plinHolder, setPlinHolder] = useState("");
  const [plinQrUrl, setPlinQrUrl] = useState<string | null>(null);

  // Instructions
  const [instructions, setInstructions] = useState("");

  const slugRef = useRef("");
  const [uploadingQr, setUploadingQr] = useState<"yape" | "plin" | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) {
      setLoading(false);
      return;
    }
    const slug = user.tenantSlug;
    slugRef.current = slug;

    fetchTenant(slug).then((data: TenantApiData | null) => {
      if (data) {
        setYapeEnabled(data.yapeEnabled ?? false);
        setYapePhone(data.yapePhone ?? "");
        setYapeHolder(data.yapeHolder ?? "");
        setYapeQrUrl(data.yapeQrUrl ?? null);
        setPlinEnabled(data.plinEnabled ?? false);
        setPlinPhone(data.plinPhone ?? "");
        setPlinHolder(data.plinHolder ?? "");
        setPlinQrUrl(data.plinQrUrl ?? null);
        setInstructions(data.paymentInstructions ?? "");
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const slug = slugRef.current;
    if (!slug) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const data = await updateTenantConfig(slug, {
        yapeEnabled,
        yapePhone,
        yapeHolder,
        plinEnabled,
        plinPhone,
        plinHolder,
        paymentInstructions: instructions,
      });
      if (!data) {
        setError("No se pudo guardar la configuración");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleQrUpload = async (method: "yape" | "plin", file: File) => {
    const slug = slugRef.current;
    if (!slug) return;

    setUploadingQr(method);
    setError(null);

    try {
      const url =
        method === "yape"
          ? await uploadYapeQr(slug, file)
          : await uploadPlinQr(slug, file);

      if (!url) {
        setError("No se pudo subir el QR");
      } else {
        if (method === "yape") setYapeQrUrl(url);
        else setPlinQrUrl(url);
      }
    } catch {
      setError("Error al subir QR");
    } finally {
      setUploadingQr(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-7 w-7 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Yape / Plin</h1>
          <p className="text-sm text-slate-500">
            Configura pagos nativos con Yape y Plin (sin Mercado Pago)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 flex items-center gap-2"
        >
          <CheckCircle2 className="h-5 w-5" />
          Configuración guardada correctamente
        </motion.div>
      )}

      {/* Yape */}
      <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
              <Smartphone className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Yape</h2>
              <p className="text-xs text-slate-500">Pago con QR del BCP</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={yapeEnabled}
              onChange={(e) => setYapeEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
          </label>
        </div>

        {yapeEnabled && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Número de celular</label>
                <input
                  type="tel"
                  value={yapePhone}
                  onChange={(e) => setYapePhone(e.target.value)}
                  placeholder="999 888 777"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Titular de la cuenta</label>
                <input
                  type="text"
                  value={yapeHolder}
                  onChange={(e) => setYapeHolder(e.target.value)}
                  placeholder="Nombre del titular"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">QR de Yape</label>
              <div className="mt-1 flex items-center gap-4">
                {yapeQrUrl ? (
                  <div className="relative">
                    <img src={yapeQrUrl} alt="QR Yape" className="h-32 w-32 rounded-lg border border-slate-200 object-contain" />
                    <button
                      onClick={() => setYapeQrUrl(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 p-4 cursor-pointer w-32 h-32">
                    {uploadingQr === "yape" ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span className="text-xs text-slate-400">Subir QR</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrUpload("yape", f);
                      }}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-500 flex-1">
                  Sube la imagen del QR que genera la app de Yape. El cliente la escaneará para pagarte.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plin */}
      <div className="rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Plin</h2>
              <p className="text-xs text-slate-500">Pago con QR del Interbank</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={plinEnabled}
              onChange={(e) => setPlinEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition" />
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-5" />
          </label>
        </div>

        {plinEnabled && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Número de celular</label>
                <input
                  type="tel"
                  value={plinPhone}
                  onChange={(e) => setPlinPhone(e.target.value)}
                  placeholder="999 888 777"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Titular de la cuenta</label>
                <input
                  type="text"
                  value={plinHolder}
                  onChange={(e) => setPlinHolder(e.target.value)}
                  placeholder="Nombre del titular"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">QR de Plin</label>
              <div className="mt-1 flex items-center gap-4">
                {plinQrUrl ? (
                  <div className="relative">
                    <img src={plinQrUrl} alt="QR Plin" className="h-32 w-32 rounded-lg border border-slate-200 object-contain" />
                    <button
                      onClick={() => setPlinQrUrl(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 p-4 cursor-pointer w-32 h-32">
                    {uploadingQr === "plin" ? (
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-slate-400" />
                        <span className="text-xs text-slate-400">Subir QR</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleQrUpload("plin", f);
                      }}
                    />
                  </label>
                )}
                <p className="text-xs text-slate-500 flex-1">
                  Sube la imagen del QR que genera la app de Plin. El cliente la escaneará para pagarte.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="rounded-2xl border border-slate-200 p-6 space-y-3">
        <h2 className="font-bold text-slate-900">Instrucciones de pago</h2>
        <p className="text-xs text-slate-500">
          Texto opcional que verá el cliente antes de subir su comprobante.
          Ej: &quot;Realiza la transferencia y envía el comprobante en los próximos 10 minutos.&quot;
        </p>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={3}
          placeholder="Instrucciones para el cliente..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full rounded-2xl bg-slate-900 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <Save className="h-5 w-5" />
            Guardar configuración
          </>
        )}
      </button>
    </div>
  );
}
