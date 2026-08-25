"use client";

import { useState, useEffect } from "react";
import { getAuthUser } from "@/lib/auth";
import {
  fetchTenant,
  fetchPendingPaymentProofs,
  fetchAllPaymentProofs,
  confirmPaymentProof,
  rejectPaymentProof,
  type TenantApiData,
  type PaymentProofApiData,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Smartphone,
  CreditCard,
} from "lucide-react";

export default function PagosPendientesPage() {
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState<PaymentProofApiData[]>([]);
  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [selected, setSelected] = useState<PaymentProofApiData | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) {
      setLoading(false);
      return;
    }

    (async () => {
      const tenant = await fetchTenant(user.tenantSlug!);
      if (!tenant) {
        setLoading(false);
        return;
      }
      await loadProofs(tenant.id, tab);
    })();
  }, [tab]);

  const loadProofs = async (tenantId: string, which: "pending" | "all") => {
    setLoading(true);
    const data =
      which === "pending"
        ? await fetchPendingPaymentProofs(tenantId)
        : await fetchAllPaymentProofs(tenantId);
    setProofs(data);
    setLoading(false);
  };

  const handleConfirm = async (proofId: string) => {
    const user = getAuthUser();
    setActing(proofId);
    setError(null);
    const res = await confirmPaymentProof(proofId, user?.name);
    if (res) {
      setProofs((prev) => prev.map((p) => (p.id === proofId ? res : p)));
      setSelected(null);
    } else {
      setError("No se pudo confirmar el pago");
    }
    setActing(null);
  };

  const handleReject = async (proofId: string) => {
    if (!rejectReason.trim()) return;
    const user = getAuthUser();
    setActing(proofId);
    setError(null);
    const res = await rejectPaymentProof(proofId, rejectReason, user?.name);
    if (res) {
      setProofs((prev) => prev.map((p) => (p.id === proofId ? res : p)));
      setSelected(null);
      setRejecting(null);
      setRejectReason("");
    } else {
      setError("No se pudo rechazar el pago");
    }
    setActing(null);
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString("es-PE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusBadge = (status: string) => {
    if (status === "APPROVED")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3 w-3" /> Aprobado
        </span>
      );
    if (status === "REJECTED")
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <XCircle className="h-3 w-3" /> Rechazado
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" /> Pendiente
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-7 w-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos pendientes</h1>
          <p className="text-sm text-slate-500">
            Verifica los comprobantes de Yape/Plin de tus clientes
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t === "pending" ? "Pendientes" : "Historial"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No hay comprobantes {tab === "pending" ? "pendientes" : ""} para revisar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="rounded-2xl border border-slate-200 p-4 flex items-center gap-4"
            >
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={proof.fileUrl}
                  alt="Comprobante"
                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover cursor-pointer"
                  onClick={() => setSelected(proof)}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {proof.paymentMethod === "yape" ? (
                    <Smartphone className="h-4 w-4 text-purple-600" />
                  ) : (
                    <CreditCard className="h-4 w-4 text-blue-600" />
                  )}
                  <span className="font-mono text-sm font-bold text-slate-900">
                    #{proof.orderId.slice(0, 8).toUpperCase()}
                  </span>
                  {statusBadge(proof.status)}
                </div>
                <p className="text-xs text-slate-500">
                  {proof.paymentMethod.toUpperCase()} · {fmtDate(proof.createdAt)}
                  {proof.verifiedBy && ` · Verificado por ${proof.verifiedBy}`}
                </p>
                {proof.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1">
                    Motivo: {proof.rejectionReason}
                  </p>
                )}
              </div>

              {/* Actions */}
              {proof.status === "PENDING_VERIFICATION" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleConfirm(proof.id)}
                    disabled={acting === proof.id}
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-60 flex items-center gap-1"
                  >
                    {acting === proof.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Aprobar
                  </button>
                  <button
                    onClick={() => setRejecting(proof.id)}
                    className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200 flex items-center gap-1"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelected(proof)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: view receipt */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-md w-full rounded-2xl bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-slate-900 mb-2">
                Comprobante #{selected.orderId.slice(0, 8).toUpperCase()}
              </h3>
              <img
                src={selected.fileUrl}
                alt="Comprobante"
                className="w-full rounded-xl border border-slate-200"
              />
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>Método: <span className="font-medium">{selected.paymentMethod.toUpperCase()}</span></p>
                <p>Estado: {statusBadge(selected.status)}</p>
                <p>Subido: {fmtDate(selected.createdAt)}</p>
                {selected.verifiedBy && <p>Verificado por: {selected.verifiedBy}</p>}
                {selected.rejectionReason && (
                  <p className="text-red-600">Motivo rechazo: {selected.rejectionReason}</p>
                )}
              </div>

              {selected.status === "PENDING_VERIFICATION" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => handleConfirm(selected.id)}
                    disabled={acting === selected.id}
                    className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                  >
                    Aprobar pago
                  </button>
                  <button
                    onClick={() => {
                      setRejecting(selected.id);
                    }}
                    className="flex-1 rounded-lg bg-red-100 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200"
                  >
                    Rechazar
                  </button>
                </div>
              )}

              <button
                onClick={() => setSelected(null)}
                className="mt-4 w-full rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: reject reason */}
      <AnimatePresence>
        {rejecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => {
              setRejecting(null);
              setRejectReason("");
            }}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-sm w-full rounded-2xl bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-bold text-slate-900 mb-2">Rechazar comprobante</h3>
              <p className="text-sm text-slate-500 mb-3">
                Indica el motivo del rechazo. El cliente podrá verlo y reenviar su comprobante.
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Ej: El monto no coincide con el total del pedido"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setRejecting(null);
                    setRejectReason("");
                  }}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleReject(rejecting)}
                  disabled={!rejectReason.trim() || acting === rejecting}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                >
                  Confirmar rechazo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
