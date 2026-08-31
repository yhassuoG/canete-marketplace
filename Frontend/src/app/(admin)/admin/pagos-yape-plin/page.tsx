"use client";

import { useState, useEffect } from "react";
import {
  fetchAllPendingProofs,
  confirmPaymentProof,
  rejectPaymentProof,
  type PaymentProofApiData,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  Smartphone,
  CreditCard,
  Building2,
} from "lucide-react";

export default function AdminPagosYapePlinPage() {
  const [loading, setLoading] = useState(true);
  const [proofs, setProofs] = useState<PaymentProofApiData[]>([]);
  const [selected, setSelected] = useState<PaymentProofApiData | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllPendingProofs();
      setProofs(data);
      setLoading(false);
    })();
  }, []);

  const handleConfirm = async (proofId: string) => {
    const user = getAuthUser();
    setActing(proofId);
    setError(null);
    const res = await confirmPaymentProof(proofId, user?.name);
    if (res) {
      setProofs((prev) => prev.filter((p) => p.id !== proofId));
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
      setProofs((prev) => prev.filter((p) => p.id !== proofId));
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Smartphone className="h-7 w-7 text-emerald-500" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pagos Yape/Plin</h1>
          <p className="text-sm text-slate-500">
            Todos los comprobantes pendientes de verificación (vista global)
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No hay comprobantes pendientes en la plataforma</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proofs.map((proof) => (
            <div
              key={proof.id}
              className="rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3 sm:gap-4"
            >
              <div className="flex-shrink-0">
                <img
                  src={proof.fileUrl}
                  alt="Comprobante"
                  className="h-16 w-16 rounded-lg border border-slate-200 object-cover cursor-pointer"
                  onClick={() => setSelected(proof)}
                />
              </div>

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
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" /> Pendiente
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Tenant: {proof.tenantId.slice(0, 8)}
                  · {proof.paymentMethod.toUpperCase()} · {fmtDate(proof.createdAt)}
                </p>
              </div>

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
                <p>Tenant: <span className="font-mono">{selected.tenantId.slice(0, 8)}</span></p>
                <p>Subido: {fmtDate(selected.createdAt)}</p>
                {selected.uploadedBy && <p>Cliente: {selected.uploadedBy}</p>}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleConfirm(selected.id)}
                  disabled={acting === selected.id}
                  className="flex-1 rounded-lg bg-emerald-500 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  Aprobar pago
                </button>
                <button
                  onClick={() => setRejecting(selected.id)}
                  className="flex-1 rounded-lg bg-red-100 py-2.5 text-sm font-bold text-red-700 hover:bg-red-200"
                >
                  Rechazar
                </button>
              </div>

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
    </div>
  );
}
