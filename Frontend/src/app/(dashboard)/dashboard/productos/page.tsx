"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Pencil, Trash2, X, Loader2, Check, AlertCircle, ImagePlus, Upload } from "lucide-react";
import { getAuthUser } from "@/lib/auth";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  type Product,
  type ProductPayload,
} from "@/lib/api";

interface FormState {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
  stock: string;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  price: "",
  category: "",
  imageUrl: "",
  available: true,
  stock: "",
  sortOrder: "0",
};

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const slugRef = useRef("");

  // Load products
  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) {
      setError("No se pudo determinar tu negocio. Vuelve a iniciar sesión.");
      setLoading(false);
      return;
    }
    const slug = user.tenantSlug;
    slugRef.current = slug;

    fetchProducts(slug).then(data => {
      if (data) {
        setProducts(data);
        setError(null);
      } else {
        setError("No se pudieron cargar los productos. Verifica que la API esté activa.");
      }
      setLoading(false);
    });
  }, []);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      category: p.category ?? "",
      imageUrl: p.imageUrl ?? "",
      available: p.available,
      stock: p.stock != null ? String(p.stock) : "",
      sortOrder: String(p.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const save = async () => {
    const slug = slugRef.current;
    if (!slug) return;

    if (!form.name.trim() || !form.price.trim()) {
      showToast("Nombre y precio son obligatorios", false);
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast("El precio debe ser un número válido ≥ 0", false);
      return;
    }

    const payload: ProductPayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: priceNum,
      category: form.category.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      available: form.available,
      stock: form.stock.trim() === "" ? null : parseInt(form.stock, 10),
      sortOrder: parseInt(form.sortOrder, 10) || 0,
    };

    setSaving(true);
    if (editingId) {
      const updated = await updateProduct(slug, editingId, payload);
      setSaving(false);
      if (updated) {
        setProducts(prev => prev.map(p => (p.id === editingId ? updated : p)));
        showToast("Producto actualizado");
        closeModal();
      } else {
        showToast("Error al actualizar el producto", false);
      }
    } else {
      const created = await createProduct(slug, payload);
      setSaving(false);
      if (created) {
        setProducts(prev => [...prev, created]);
        showToast("Producto creado");
        closeModal();
      } else {
        showToast("Error al crear el producto", false);
      }
    }
  };

  const remove = async (id: string) => {
    const slug = slugRef.current;
    if (!slug) return;
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;

    const ok = await deleteProduct(slug, id);
    if (ok) {
      setProducts(prev => prev.filter(p => p.id !== id));
      showToast("Producto eliminado");
    } else {
      showToast("Error al eliminar el producto", false);
    }
  };

  const toggleAvailable = async (p: Product) => {
    const slug = slugRef.current;
    if (!slug) return;
    const updated = await updateProduct(slug, p.id, {
      name: p.name,
      description: p.description ?? undefined,
      price: p.price,
      category: p.category ?? undefined,
      imageUrl: p.imageUrl ?? undefined,
      available: !p.available,
      stock: p.stock,
      sortOrder: p.sortOrder,
    });
    if (updated) {
      setProducts(prev => prev.map(x => (x.id === p.id ? updated : x)));
    } else {
      showToast("Error al cambiar disponibilidad", false);
    }
  };

  const handleImageUpload = async (productId: string, file: File) => {
    const slug = slugRef.current;
    if (!slug) return;
    setUploadingImage(true);
    const imageUrl = await uploadProductImage(slug, productId, file);
    setUploadingImage(false);
    if (imageUrl) {
      setProducts(prev => prev.map(p => (p.id === productId ? { ...p, imageUrl } : p)));
      showToast("Imagen subida");
    } else {
      showToast("Error al subir imagen", false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 sm:px-6 lg:px-8 py-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-[#0c4a6e]" />
          <div>
            <h1 className="text-lg font-semibold text-ink">Productos</h1>
            <p className="text-sm text-slate-400">Administra el catálogo de tu tienda</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0c4a6e]/90"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </header>

      <div className="p-4 sm:p-6">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando productos…</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Package className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm">Aún no tienes productos. Crea el primero con el botón superior.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {products.map(p => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
                >
                  {/* Product image */}
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-10 w-10 text-slate-300" />
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.dataset.productId = p.id;
                          fileInputRef.current.click();
                        }
                      }}
                      disabled={uploadingImage}
                      className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-xl bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition-colors hover:bg-black/80 disabled:opacity-50"
                    >
                      {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                      Subir imagen
                    </button>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-ink">{p.name}</h3>
                      {p.category && (
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                          {p.category}
                        </span>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.available
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {p.available ? "Disponible" : "Oculto"}
                    </span>
                  </div>

                  {p.description && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{p.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-4">
                    <span className="text-lg font-bold text-[#0c4a6e]">S/ {Number(p.price).toFixed(2)}</span>
                    {p.stock != null && (
                      <span className="text-xs text-slate-400">Stock: {p.stock}</span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => toggleAvailable(p)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      {p.available ? "Ocultar" : "Mostrar"}
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  {editingId ? "Editar producto" : "Nuevo producto"}
                </h2>
                <button onClick={closeModal} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Nombre *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                    placeholder="Ej. Ceviche clásico"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                    placeholder="Breve descripción del producto"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Precio (S/) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Categoría</label>
                    <input
                      value={form.category}
                      onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                      placeholder="Ej. Entradas"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                      placeholder="Vacío = sin control"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Orden</label>
                    <input
                      type="number"
                      value={form.sortOrder}
                      onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Imagen del producto</label>
                  {form.imageUrl ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.imageUrl}
                        alt="preview"
                        className="h-32 w-full rounded-2xl border border-slate-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                        className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                      <div className="text-center text-sm text-slate-400">
                        <ImagePlus className="mx-auto h-6 w-6 mb-1" />
                        {editingId
                          ? "Usa el botón \"Subir imagen\" en la tarjeta"
                          : "Crea el producto y luego sube la imagen"}
                      </div>
                    </div>
                  )}
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c4a6e]/20"
                    placeholder="O pega una URL: https://…"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={e => setForm(f => ({ ...f, available: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Disponible para la venta
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-[#0c4a6e] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0c4a6e]/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? "Guardar" : "Crear"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl px-5 py-2.5 text-sm font-medium text-white shadow-lg ${
              toast.ok ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for product image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          const productId = e.target.dataset.productId;
          if (file && productId) {
            handleImageUpload(productId, file);
          }
          e.target.value = "";
        }}
      />
    </div>
  );
}
