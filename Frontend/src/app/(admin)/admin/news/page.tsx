"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Trash2, Pencil, Upload, Newspaper } from "lucide-react";
import {
  fetchNews,
  fetchDistricts,
  createNews,
  updateNews,
  deleteNews,
  uploadImage,
  type NewsApiData,
  type NewsPayload,
  type DistrictApiData,
} from "@/lib/api";

const EMPTY_FORM: NewsPayload = {
  slug: "",
  title: "",
  summary: "",
  content: "",
  imageUrl: "",
  category: "Comunidad",
  districtSlug: "",
  publishedAt: new Date().toISOString().slice(0, 10),
};

export default function AdminNewsPage() {
  const [news, setNews] = useState<NewsApiData[]>([]);
  const [districts, setDistricts] = useState<DistrictApiData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewsPayload>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchNews().then(setNews);
    fetchDistricts().then(setDistricts);
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(n: NewsApiData) {
    setForm({
      slug: n.slug,
      title: n.title,
      summary: n.summary ?? "",
      content: n.content ?? "",
      imageUrl: n.imageUrl ?? "",
      category: n.category ?? "Comunidad",
      districtSlug: n.districtSlug ?? "",
      publishedAt: (n.publishedAt ?? new Date().toISOString()).slice(0, 10),
    });
    setEditingId(n.id);
    setError(null);
    setShowModal(true);
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const result = await uploadImage(file, "news", form.slug || form.title);
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

    // Convert date-only "YYYY-MM-DD" to full ISO datetime for backend LocalDateTime
    const payload: NewsPayload = {
      ...form,
      publishedAt: form.publishedAt && form.publishedAt.length === 10
        ? form.publishedAt + "T00:00:00"
        : form.publishedAt,
    };

    const result = editingId ? await updateNews(editingId, payload) : await createNews(payload);

    if (!result.ok) {
      setError(result.error ?? "Error desconocido");
      setIsSubmitting(false);
      return;
    }

    const refreshed = await fetchNews();
    setNews(refreshed);
    setShowModal(false);
    setIsSubmitting(false);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`¿Eliminar la noticia "${title}"?`)) return;
    const result = await deleteNews(id);
    if (result.ok) {
      setNews((current) => current.filter((n) => n.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-ink">Noticias</h1>
            <p className="text-sm text-slate-400">{news.length} noticias registradas</p>
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-medium text-white hover:bg-ink/90" onClick={openCreate} type="button">
            <Plus className="h-4 w-4" />
            Nueva noticia
          </button>
        </div>
      </header>

      <div className="p-8">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {news.map((n, i) => (
            <motion.div key={n.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
              {n.imageUrl ? (
                <img src={n.imageUrl} alt={n.title} className="mb-4 h-32 w-full rounded-2xl object-cover" />
              ) : (
                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-2xl bg-slate-100">
                  <Newspaper className="h-8 w-8 text-slate-300" />
                </div>
              )}
              <h2 className="font-semibold text-ink">{n.title}</h2>
              <p className="text-xs text-slate-400">/{n.slug} · {n.category}</p>
              {n.summary ? <p className="mt-2 text-sm text-slate-500 line-clamp-2">{n.summary}</p> : null}
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEdit(n)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                <button onClick={() => handleDelete(n.id, n.title)} className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50">
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
              <h2 className="text-2xl font-semibold text-ink">{editingId ? "Editar noticia" : "Nueva noticia"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input value={form.slug} onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value.toLowerCase() }))} placeholder="Slug" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
                <input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Título" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" required />
              </div>
              <input value={form.summary ?? ""} onChange={(e) => setForm((c) => ({ ...c, summary: e.target.value }))} placeholder="Resumen" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <textarea value={form.content ?? ""} onChange={(e) => setForm((c) => ({ ...c, content: e.target.value }))} placeholder="Contenido" className="min-h-32 rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              <div className="grid gap-4 md:grid-cols-3">
                <input value={form.category ?? ""} onChange={(e) => setForm((c) => ({ ...c, category: e.target.value }))} placeholder="Categoría" className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
                <select value={form.districtSlug ?? ""} onChange={(e) => setForm((c) => ({ ...c, districtSlug: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none">
                  <option value="">Sin distrito</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.slug}>{d.name}</option>
                  ))}
                </select>
                <input type="date" value={form.publishedAt ?? ""} onChange={(e) => setForm((c) => ({ ...c, publishedAt: e.target.value }))} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none" />
              </div>

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
