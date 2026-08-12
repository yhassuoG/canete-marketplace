"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Shield,
  User,
  HeadphonesIcon,
  X,
  Trash2,
  Pencil,
  Power,
} from "lucide-react";
import {
  fetchUsers,
  fetchAllCustomers,
  fetchTenants,
  createUser,
  updateUser,
  deleteUser,
  setUserStatus,
  type UserApiData,
  type CustomerApiData,
  type TenantApiData,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/lib/api";

const ROLE_ICON: Record<string, typeof Shield> = {
  admin: Shield,
  business_owner: User,
  customer: HeadphonesIcon,
};
const ROLE_COLOR: Record<string, string> = {
  admin: "text-violet-600 bg-violet-50",
  business_owner: "text-emerald-600 bg-emerald-50",
  customer: "text-blue-600 bg-blue-50",
};
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  business_owner: "Dueño de negocio",
  customer: "Cliente",
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace un momento";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

const EMPTY_FORM: CreateUserPayload = {
  email: "",
  password: "",
  fullName: "",
  role: "admin",
  tenantSlug: null,
};

export default function AdminUsersPage() {
  const [tab, setTab] = useState<"admins" | "customers">("admins");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserApiData[]>([]);
  const [customers, setCustomers] = useState<CustomerApiData[]>([]);
  const [tenants, setTenants] = useState<TenantApiData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateUserPayload>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [u, c, t] = await Promise.all([
        fetchUsers(),
        fetchAllCustomers(),
        fetchTenants(),
      ]);
      setUsers(u);
      setCustomers(c);
      setTenants(t);
      setLoading(false);
    })();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
    setShowModal(true);
  }

  function openEdit(u: UserApiData) {
    setEditingId(u.id);
    setEditForm({
      email: u.email,
      fullName: u.fullName,
      role: u.role as "admin" | "business_owner" | "customer",
      tenantSlug: u.tenantSlug,
      status: u.status as "active" | "suspended",
      password: null,
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (editingId) {
      const result = await updateUser(editingId, editForm);
      if (!result.ok) {
        setError(result.error ?? "Error");
        setIsSubmitting(false);
        return;
      }
    } else {
      const result = await createUser(form);
      if (!result.ok) {
        setError(result.error ?? "Error");
        setIsSubmitting(false);
        return;
      }
    }

    // Recargar
    const refreshed = await fetchUsers();
    setUsers(refreshed);
    setShowModal(false);
    setIsSubmitting(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar el usuario "${name}"?`)) return;
    const result = await deleteUser(id);
    if (result.ok) {
      setUsers((current) => current.filter((u) => u.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  async function handleToggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    const result = await setUserStatus(
      id,
      newStatus as "active" | "suspended"
    );
    if (result.ok) {
      setUsers((current) =>
        current.map((u) =>
          u.id === id ? { ...u, status: newStatus } : u
        )
      );
    } else {
      alert(`Error: ${result.error}`);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
          <p className="text-sm text-slate-400 mt-1">Administradores y clientes de la plataforma</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-xl bg-[#083d77] px-4 py-2.5 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4"/> Nuevo usuario
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-white border border-slate-100 p-1 w-fit shadow-soft">
        {(["admins", "customers"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-xl px-5 py-2 text-sm font-medium transition-all ${tab === t ? "bg-[#083d77] text-white shadow" : "text-slate-500 hover:text-ink"}`}>
            {t === "admins" ? `Admins (${users.length})` : `Clientes (${customers.length})`}
          </button>
        ))}
      </div>

      {tab === "admins" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-50">
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Usuario</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Rol</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Negocio</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Último acceso</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Estado</th>
              <th className="px-6 py-4"/>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">Cargando usuarios…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-slate-400">No hay usuarios</td></tr>
              ) : users.map((u) => {
                const RoleIcon = ROLE_ICON[u.role] ?? User;
                const isActive = u.status === "active";
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#083d77] to-[#1a5ba8] flex items-center justify-center text-xs font-bold text-white">{initials(u.fullName)}</div>
                        <div><p className="font-medium text-ink">{u.fullName}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${ROLE_COLOR[u.role] ?? "text-slate-600 bg-slate-50"}`}>
                        <RoleIcon className="h-3 w-3"/>{ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{u.tenantSlug ? <span className="text-xs">{u.tenantSlug}</span> : "—"}</td>
                    <td className="px-6 py-4 text-slate-500">{timeAgo(u.lastLoginAt)}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}/>{isActive ? "Activo" : "Suspendido"}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(u)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50" title="Editar"><Pencil className="h-3.5 w-3.5"/></button>
                        <button onClick={() => handleToggleStatus(u.id, u.status)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50" title={isActive ? "Suspender" : "Activar"}><Power className="h-3.5 w-3.5"/></button>
                        <button onClick={() => handleDelete(u.id, u.fullName)} className="rounded-lg border border-rose-200 p-1.5 text-rose-500 hover:bg-rose-50" title="Eliminar"><Trash2 className="h-3.5 w-3.5"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {tab === "customers" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar clientes..." className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#083d77]/20 shadow-soft"/>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-white shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-50">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Cliente</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Pedidos</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400">Total gastado</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Miembro desde</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">Cargando clientes…</td></tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-sm text-slate-400">No se encontraron clientes</td></tr>
                ) : filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">{initials(c.name)}</div>
                        <div><p className="font-medium text-ink">{c.name}</p><p className="text-xs text-slate-400">{c.email ?? "—"}</p></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-ink">{c.visits}</td>
                    <td className="px-6 py-4 text-right font-semibold text-ink">S/{c.spent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{c.joinedDate ? new Date(c.joinedDate).toLocaleDateString("es-PE", { month: "short", year: "numeric" }) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Modal Crear/Editar */}
      {showModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <h2 className="text-2xl font-semibold text-ink">{editingId ? "Editar usuario" : "Nuevo usuario"}</h2>
              <button type="button" onClick={() => setShowModal(false)} className="rounded-full border border-slate-200 p-2 text-slate-500"><X className="h-4 w-4"/></button>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <input
                value={editingId ? editForm.fullName ?? "" : form.fullName}
                onChange={(e) => editingId ? setEditForm((c) => ({ ...c, fullName: e.target.value })) : setForm((c) => ({ ...c, fullName: e.target.value }))}
                placeholder="Nombre completo"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                required
              />
              <input
                type="email"
                value={editingId ? editForm.email ?? "" : form.email}
                onChange={(e) => editingId ? setEditForm((c) => ({ ...c, email: e.target.value })) : setForm((c) => ({ ...c, email: e.target.value }))}
                placeholder="Email"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                required
              />
              <input
                type="text"
                value={editingId ? editForm.password ?? "" : form.password}
                onChange={(e) => editingId ? setEditForm((c) => ({ ...c, password: e.target.value || null })) : setForm((c) => ({ ...c, password: e.target.value }))}
                placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña"}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
                required={!editingId}
              />
              <select
                value={editingId ? editForm.role ?? "admin" : form.role}
                onChange={(e) => {
                  const role = e.target.value as "admin" | "business_owner" | "customer";
                  editingId ? setEditForm((c) => ({ ...c, role })) : setForm((c) => ({ ...c, role }));
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="admin">Admin</option>
                <option value="business_owner">Dueño de negocio</option>
                <option value="customer">Cliente</option>
              </select>
              <select
                value={editingId ? editForm.tenantSlug ?? "" : form.tenantSlug ?? ""}
                onChange={(e) => {
                  const val = e.target.value || null;
                  editingId ? setEditForm((c) => ({ ...c, tenantSlug: val })) : setForm((c) => ({ ...c, tenantSlug: val }));
                }}
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              >
                <option value="">Sin negocio asociado</option>
                {tenants.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name} (/{t.slug})</option>
                ))}
              </select>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-600">Cancelar</button>
                <button type="submit" disabled={isSubmitting} className="rounded-2xl bg-ink px-5 py-3 text-sm font-medium text-white disabled:opacity-60">{isSubmitting ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
