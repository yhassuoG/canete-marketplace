"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, MoreVertical, Shield, User, HeadphonesIcon } from "lucide-react";
import {
  fetchUsers,
  fetchAllCustomers,
  UserApiData,
  CustomerApiData,
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

export default function AdminUsersPage() {
  const [tab, setTab] = useState<"admins" | "customers">("admins");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserApiData[]>([]);
  const [customers, setCustomers] = useState<CustomerApiData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [u, c] = await Promise.all([fetchUsers(), fetchAllCustomers()]);
      setUsers(u);
      setCustomers(c);
      setLoading(false);
    })();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Usuarios</h1>
          <p className="text-sm text-slate-400 mt-1">Administradores y clientes de la plataforma</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-[#083d77] px-4 py-2.5 text-sm font-semibold text-white">
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
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Último acceso</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-slate-400">Estado</th>
              <th className="px-6 py-4"/>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">Cargando usuarios…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-sm text-slate-400">No hay usuarios</td></tr>
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
                    <td className="px-6 py-4 text-slate-500">{timeAgo(u.lastLoginAt)}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}><span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}/>{isActive ? "Activo" : "Suspendido"}</span></td>
                    <td className="px-6 py-4 text-right"><button className="text-slate-400 hover:text-slate-600"><MoreVertical className="h-4 w-4"/></button></td>
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
    </div>
  );
}
