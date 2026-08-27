"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Save,
  Upload,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  fetchTenants,
  getTaxConfig,
  saveTaxConfig,
  toggleInvoicingEnabled,
  type TenantApiData,
  type TenantTaxConfig,
} from "@/lib/api";

interface TenantWithConfig extends TenantApiData {
  taxConfig?: TenantTaxConfig | null;
  loading?: boolean;
}

export default function AdminInvoicingPage() {
  const [tenants, setTenants] = useState<TenantWithConfig[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    setLoading(true);
    try {
      const data = await fetchTenants();
      // Filtrar solo premium y enterprise
      const eligible = data.filter((t) => t.plan === "premium" || t.plan === "enterprise");
      setTenants(eligible.map((t) => ({ ...t, taxConfig: null, loading: true })));

      // Cargar config de cada tenant
      for (const t of eligible) {
        const config = await getTaxConfig(t.id);
        setTenants((prev) =>
          prev.map((x) => (x.id === t.id ? { ...x, taxConfig: config, loading: false } : x))
        );
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  async function handleToggleEnabled(tenantId: string, enabled: boolean) {
    const result = await toggleInvoicingEnabled(tenantId, enabled);
    if (result.ok) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === tenantId
            ? { ...t, taxConfig: { ...(t.taxConfig || emptyConfig()), enabled } }
            : t
        )
      );
    } else {
      setError(result.error || "Error al cambiar estado");
    }
  }

  async function handleSaveConfig() {
    if (!selectedTenant) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    const config = selectedTenant.taxConfig;
    if (!config) return;
    const result = await saveTaxConfig(selectedTenant.id, config);
    if (result.ok) {
      setSuccess("Configuración guardada correctamente");
      setTenants((prev) =>
        prev.map((t) => (t.id === selectedTenant.id ? { ...t, taxConfig: config } : t))
      );
      setTimeout(() => setSuccess(null), 3000);
    } else {
      setError(result.error || "Error al guardar");
    }
    setSaving(false);
  }

  function handleCertUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedTenant?.taxConfig) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      updateConfig("certBase64", base64);
    };
    reader.readAsDataURL(file);
  }

  function updateConfig(field: string, value: unknown) {
    if (!selectedTenant?.taxConfig) return;
    setSelectedTenant({
      ...selectedTenant,
      taxConfig: { ...selectedTenant.taxConfig, [field]: value },
    });
  }

  function emptyConfig(): TenantTaxConfig {
    return {
      ruc: "",
      razonSocial: "",
      domicilioFiscal: "",
      ubigeo: "",
      distrito: "",
      provincia: "",
      departamento: "",
      enabled: false,
      sunatMode: "beta",
      serieBoleta: "B001",
      serieFactura: "F001",
      codigoPais: "PE",
      igvRate: 18,
    };
  }

  return (
    <div className="min-h-screen bg-admin-bg p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-admin-fg">
              <Receipt className="h-7 w-7 text-admin-accent" />
              Facturación Electrónica SUNAT
            </h1>
            <p className="mt-1 text-sm text-admin-muted">
              Configura la facturación electrónica para empresas con plan Premium/Enterprise
            </p>
          </div>
        </div>

        {/* Alert */}
        <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-400" />
            <div className="text-sm text-admin-muted">
              <p className="font-medium text-admin-fg">Requisitos para facturar:</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                <li>La empresa debe tener plan Premium o Enterprise</li>
                <li>RUC activo en SUNAT</li>
                <li>Certificado digital (.pfx/.p12) para firma electrónica</li>
                <li>Claves SOL (usuario secundario de SUNAT)</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted" />
            <input
              type="text"
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-admin-border bg-admin-card py-2 pl-10 pr-4 text-sm text-admin-fg placeholder:text-admin-muted focus:border-admin-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Tenants list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-admin-accent" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tenant) => {
              const isEnabled = tenant.taxConfig?.enabled === true;
              const hasRuc = !!tenant.taxConfig?.ruc;
              return (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-admin-border bg-admin-card p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-admin-accent/10">
                        <Building2 className="h-5 w-5 text-admin-accent" />
                      </div>
                      <div>
                        <p className="font-semibold text-admin-fg">{tenant.name}</p>
                        <p className="text-xs text-admin-muted">{tenant.slug}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        tenant.plan === "premium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-purple-500/10 text-purple-400"
                      }`}
                    >
                      {tenant.plan}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {hasRuc ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-admin-muted">RUC: {tenant.taxConfig?.ruc}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-admin-muted" />
                          <span className="text-admin-muted">Sin configurar</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isEnabled ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                          <span className="text-green-400">Facturación activa</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-admin-muted" />
                          <span className="text-admin-muted">Facturación inactiva</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setSelectedTenant({ ...tenant, taxConfig: tenant.taxConfig || emptyConfig() })}
                      className="flex-1 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm font-medium text-admin-fg transition hover:border-admin-accent"
                    >
                      Configurar
                    </button>
                    <button
                      onClick={() => handleToggleEnabled(tenant.id, !isEnabled)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isEnabled
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {isEnabled ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Modal de configuración */}
        {selectedTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedTenant(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-admin-border bg-admin-card p-6"
            >
              <h2 className="mb-1 text-xl font-bold text-admin-fg">
                Configurar facturación - {selectedTenant.name}
              </h2>
              <p className="mb-6 text-sm text-admin-muted">
                Completa los datos tributarios para emitir comprobantes electrónicos
              </p>

              {selectedTenant.taxConfig && (
                <div className="space-y-4">
                  {/* Datos del emisor */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="RUC *" value={selectedTenant.taxConfig.ruc} onChange={(v) => updateConfig("ruc", v)} placeholder="20123456789" />
                    <Field label="Razón Social *" value={selectedTenant.taxConfig.razonSocial} onChange={(v) => updateConfig("razonSocial", v)} placeholder="Mi Empresa SAC" />
                    <Field label="Nombre Comercial" value={selectedTenant.taxConfig.nombreComercial || ""} onChange={(v) => updateConfig("nombreComercial", v)} />
                    <Field label="Domicilio Fiscal *" value={selectedTenant.taxConfig.domicilioFiscal} onChange={(v) => updateConfig("domicilioFiscal", v)} />
                    <Field label="Ubigeo *" value={selectedTenant.taxConfig.ubigeo} onChange={(v) => updateConfig("ubigeo", v)} placeholder="060101" />
                    <Field label="Urbanización" value={selectedTenant.taxConfig.urbanizacion || ""} onChange={(v) => updateConfig("urbanizacion", v)} />
                    <Field label="Distrito *" value={selectedTenant.taxConfig.distrito} onChange={(v) => updateConfig("distrito", v)} />
                    <Field label="Provincia *" value={selectedTenant.taxConfig.provincia} onChange={(v) => updateConfig("provincia", v)} />
                    <Field label="Departamento *" value={selectedTenant.taxConfig.departamento} onChange={(v) => updateConfig("departamento", v)} />
                  </div>

                  {/* Series */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Serie Boleta" value={selectedTenant.taxConfig.serieBoleta || "B001"} onChange={(v) => updateConfig("serieBoleta", v)} />
                    <Field label="Serie Factura" value={selectedTenant.taxConfig.serieFactura || "F001"} onChange={(v) => updateConfig("serieFactura", v)} />
                  </div>

                  {/* SUNAT */}
                  <div className="rounded-lg border border-admin-border p-4">
                    <p className="mb-3 font-medium text-admin-fg">Credenciales SUNAT SOL</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Modo" value={selectedTenant.taxConfig.sunatMode || "beta"} onChange={(v) => updateConfig("sunatMode", v)} />
                      <Field label="Usuario SOL" value={selectedTenant.taxConfig.solUser || ""} onChange={(v) => updateConfig("solUser", v)} />
                      <Field label="Password SOL" type="password" value={selectedTenant.taxConfig.solPassword || ""} onChange={(v) => updateConfig("solPassword", v)} />
                    </div>
                  </div>

                  {/* Certificado */}
                  <div className="rounded-lg border border-admin-border p-4">
                    <p className="mb-3 font-medium text-admin-fg">Certificado Digital (.pfx/.p12)</p>
                    <div className="space-y-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-admin-border p-3 text-sm text-admin-muted hover:border-admin-accent">
                        <Upload className="h-4 w-4" />
                        <span>
                          {selectedTenant.taxConfig.certBase64
                            ? "✓ Certificado cargado"
                            : "Subir certificado .pfx/.p12"}
                        </span>
                        <input type="file" accept=".pfx,.p12" className="hidden" onChange={handleCertUpload} />
                      </label>
                      <Field label="Password del certificado" type="password" value={selectedTenant.taxConfig.certPassword || ""} onChange={(v) => updateConfig("certPassword", v)} />
                      <Field label="Alias del certificado" value={selectedTenant.taxConfig.certAlias || ""} onChange={(v) => updateConfig("certAlias", v)} />
                    </div>
                  </div>

                  {/* Enabled */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedTenant.taxConfig.enabled}
                      onChange={(e) => updateConfig("enabled", e.target.checked)}
                      className="h-4 w-4 rounded border-admin-border"
                    />
                    <span className="text-sm text-admin-fg">Habilitar facturación electrónica</span>
                  </label>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setSelectedTenant(null)}
                      className="rounded-lg border border-admin-border px-4 py-2 text-sm text-admin-muted hover:text-admin-fg"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveConfig}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-admin-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-admin-muted">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-sm text-admin-fg placeholder:text-admin-muted focus:border-admin-accent focus:outline-none"
      />
    </div>
  );
}
