"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Trash2, Pencil, Gift, Upload } from "lucide-react";
import {
  fetchAllRewards,
  createReward,
  updateReward,
  deleteReward,
  uploadImage,
  fetchAllTenantsIncludingSuspended,
  type RewardApiData,
  type RewardPayload,
  type TenantApiData,
} from "@/lib/api";

const EMPTY_FORM: RewardPayload & { isActive: boolean } = {
  tenantId: null,
  title: "",
  description: "",
  costPoints: 100,
  emoji: "🎁",
  imageUrl: "",
  isActive: true,
};

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<RewardApiData[]>([]);
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RewardPayload & { isActive: boolean }>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllRewards().then(setRewards);
    fetchAllTenantsIncludingSuspended().then(setTenants);
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(r: RewardApiData) {
    setForm({
      tenantId: r.tenantId,
      title: r.title,
      description: r.description ?? "",
      costPoints: r.costPoints,
      emoji: r.emoji,
      imageUrl: r.imageUrl ?? "",
      isActive: r.isActive,
    });
    setEditingId(r.id);
    setError(null);
    setShowModal(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const result = await uploadImage(file, "rewards", form.title);
    setUploading(false);
    if (result) {
      setForm((current) => ({ ...current, imageUrl: result.url }));
    } else {
      alert("Error al subir imagen");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload: RewardPayload = {
      tenantId: form.tenantId || null,
      title: form.title,
      description: form.description || null,
      costPoints: form.costPoints,
      emoji: form.emoji || "🎁",
      imageUrl: form.imageUrl || null,
    };

    const result = editingId
      ? await updateReward(editingId, { ...payload, isActive: form.isActive })
      : await createReward(payload);

    if (!result.ok) {
      setError(result.error ?? "Error desconocido");
      setIsSubmitting(false);
      return;
    }

    const refreshed = await fetchAllRewards();
    setRewards(refreshed);
    setShowModal(false);
    setIsSubmitting(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar la recompensa "${title}"?`)) return;
    const result = await deleteReward(id);
    if (result.ok) {
      setRewards((current) => current.filter((r) => r.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  async function handleToggleActive(r: RewardApiData) {
    const result = await updateReward(r.id, { isActive: !r.isActive });
    if (result.ok) {
      setRewards((current) =>
        current.map((x) => (x.id === r.id ? { ...x, isActive: !r.isActive } : x))
      );
    }
  }

  function tenantName(tenantId: string | null) {
    if (!tenantId) return "Global";
    const t = tenants.find((x) => x.id === tenantId);
    return t?.name ?? "Desconocido";
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Recompensas</h1>
            <p className="text-sm text-slate-400">{rewards.length} recompensas registradas</p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            onClick={openCreate}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nueva recompensa
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rewards.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-3xl border border-slate-100 bg-white p-6 shadow-soft ${!r.isActive ? "opacity-60" : ""}`}
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{r.emoji}</span>
                  <div>
                    <h2 className="font-semibold text-ink">{r.title}</h2>
                    <p className="text-xs text-slate-400">{tenantName(r.tenantId)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(r)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${r.isActive ? "bg-emerald-500" : "bg-slate-300"}`}
                  type="button"
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${r.isActive ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {r.imageUrl ? (
                <img src={r.imageUrl} alt={r.title} className="mb-3 h-28 w-full rounded-2xl object-cover" />
              ) : null}

              {r.description ? (
                <p className="mb-3 text-sm text-slate-500 line-clamp-2">{r.description}</p>
              ) : null}

              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {r.costPoints} pts
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                  {r.isActive ? "Activa" : "Inactiva"}
                </span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(r)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => handleDelete(r.id, r.title)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3 w-3" /> Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {rewards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Gift className="mb-4 h-12 w-12" />
            <p className="text-sm">No hay recompensas. Crea la primera con el botón de arriba.</p>
          </div>
        ) : null}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-ink">{editingId ? "Editar recompensa" : "Nueva recompensa"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-600">Tienda (vacío = global)</label>
                <select
                  value={form.tenantId ?? ""}
                  onChange={(e) => setForm((c) => ({ ...c, tenantId: e.target.value || null }))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                >
                  <option value="">Global (todas las tiendas)</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Título (ej: 10% de descuento)" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
                <input value={form.emoji} onChange={(e) => setForm((c) => ({ ...c, emoji: e.target.value }))} placeholder="Emoji 🎁" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" maxLength={10} />
              </div>

              <textarea value={form.description ?? ""} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Descripción" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-600">Costo en puntos</label>
                  <input type="number" min={1} value={form.costPoints} onChange={(e) => setForm((c) => ({ ...c, costPoints: Number(e.target.value) }))} placeholder="100" className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
                </div>
                {editingId ? (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-600">Estado</label>
                    <select
                      value={form.isActive ? "active" : "inactive"}
                      onChange={(e) => setForm((c) => ({ ...c, isActive: e.target.value === "active" }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                    >
                      <option value="active">Activa</option>
                      <option value="inactive">Inactiva</option>
                    </select>
                  </div>
                ) : null}
              </div>

              {/* Imagen */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-2 text-sm font-semibold text-ink">Imagen (opcional)</p>
                {form.imageUrl ? (
                  <div className="relative">
                    <img src={form.imageUrl} alt="preview" className="h-32 w-full rounded-xl object-cover" />
                    <button type="button" onClick={() => setForm((c) => ({ ...c, imageUrl: "" }))} className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-1.5 text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-6 text-sm text-slate-400 hover:bg-slate-50">
                    <Upload className="h-4 w-4" />
                    {uploading ? "Subiendo..." : "Subir imagen"}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                  </label>
                )}
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">
                  {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
