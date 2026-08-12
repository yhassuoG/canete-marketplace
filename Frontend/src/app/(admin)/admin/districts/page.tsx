"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Trash2, Pencil, Upload, MapPin } from "lucide-react";
import {
  fetchDistricts,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  uploadImage,
  type DistrictApiData,
  type DistrictPayload,
} from "@/lib/api";

const EMPTY_FORM: DistrictPayload = {
  slug: "",
  name: "",
  description: "",
  imageUrl: "",
  region: "Cañete",
  sortOrder: 0,
};

export default function AdminDistrictsPage() {
  const [districts, setDistricts] = useState<DistrictApiData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DistrictPayload>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDistricts().then(setDistricts);
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(d: DistrictApiData) {
    setForm({
      slug: d.slug,
      name: d.name,
      description: d.description ?? "",
      imageUrl: d.imageUrl ?? "",
      region: d.region ?? "Cañete",
      sortOrder: d.sortOrder ?? 0,
    });
    setEditingId(d.id);
    setError(null);
    setShowModal(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const result = await uploadImage(file, "districts", form.slug || form.name);
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

    const result = editingId
      ? await updateDistrict(editingId, form)
      : await createDistrict(form);

    if (!result.ok) {
      setError(result.error ?? "Error desconocido");
      setIsSubmitting(false);
      return;
    }

    // Recargar lista
    const refreshed = await fetchDistricts();
    setDistricts(refreshed);
    setShowModal(false);
    setIsSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el distrito "${name}"?`)) return;
    const result = await deleteDistrict(id);
    if (result.ok) {
      setDistricts((current) => current.filter((d) => d.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Distritos</h1>
            <p className="text-sm text-slate-400">{districts.length} distritos registrados</p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90"
            onClick={openCreate}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Nuevo distrito
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {districts.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft"
            >
              {d.imageUrl ? (
                <img src={d.imageUrl} alt={d.name} className="mb-4 h-32 w-full rounded-2xl object-cover" />
              ) : (
                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-2xl bg-slate-100">
                  <MapPin className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <h2 className="font-semibold text-ink">{d.name}</h2>
              <p className="text-xs text-slate-400">/{d.slug}</p>
              {d.description ? <p className="mt-2 text-sm text-slate-500 line-clamp-2">{d.description}</p> : null}
              <p className="mt-2 text-xs text-slate-400">Región: {d.region}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(d)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => handleDelete(d.id, d.name)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">
                  <Trash2 className="h-3 w-3" /> Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-ink">{editingId ? "Editar distrito" : "Nuevo distrito"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value.toLowerCase() }))} placeholder="Slug (ej: cerro-azul)" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
                <input value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Nombre" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
              </div>
              <textarea value={form.description ?? ""} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Descripción" className="min-h-24 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.region ?? ""} onChange={(e) => setForm((c) => ({ ...c, region: e.target.value }))} placeholder="Región" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
                <input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm((c) => ({ ...c, sortOrder: Number(e.target.value) }))} placeholder="Orden" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              </div>

              {/* Imagen */}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="mb-2 text-sm font-semibold text-ink">Imagen</p>
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
