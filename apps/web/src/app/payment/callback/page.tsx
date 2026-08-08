"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { getPaymentStatus } from "@/lib/api";

function PaymentCallbackContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id") || params.get("external_reference") || "";
  const collectionStatus = params.get("collection_status") || params.get("status") || "";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");
  const [mpStatus, setMpStatus] = useState<string>("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    // Polling: consultar estado del pago cada 2s, hasta 15 intentos (30s)
    let attempts = 0;
    const maxAttempts = 15;

    const poll = async () => {
      const result = await getPaymentStatus(orderId);
      if (!result) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          // Timeout: usar el status que vino en la URL
          setStatus(collectionStatus || "unknown");
          setLoading(false);
        }
        return;
      }

      setStatus(result.status);
      setMpStatus(result.mpPaymentStatus);

      // Si el pago ya fue procesado (confirmed o rejected), dejar de hacer polling
      if (
        result.status === "confirmed" ||
        result.status === "payment_rejected" ||
        result.status === "cancelled" ||
        result.mpPaymentStatus === "approved" ||
        result.mpPaymentStatus === "rejected"
      ) {
        setLoading(false);
        return;
      }

      // Seguir haciendo polling si sigue pendiente
      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(poll, 2000);
      } else {
        setLoading(false);
      }
    };

    poll();
  }, [orderId, collectionStatus]);

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">Verificando pago…</h1>
            <p className="text-sm text-slate-500 mt-1">
              Estamos confirmando tu transacción con Mercado Pago.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Determinar el resultado
  const isApproved =
    status === "confirmed" ||
    mpStatus === "approved" ||
    collectionStatus === "approved";

  const isRejected =
    status === "payment_rejected" ||
    mpStatus === "rejected" ||
    collectionStatus === "rejected";

  const isPending =
    status === "pending_payment" ||
    mpStatus === "pending" ||
    mpStatus === "in_process" ||
    collectionStatus === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl p-8 text-center space-y-4">
        {isApproved ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">¡Pago confirmado!</h1>
            <p className="text-sm text-slate-500">
              Tu pedido ha sido confirmado y el pago se procesó correctamente.
              Te enviaremos una confirmación por WhatsApp.
            </p>
            {orderId && (
              <p className="text-xs text-slate-400">
                Orden: <span className="font-mono font-semibold">{orderId.slice(0, 8).toUpperCase()}</span>
              </p>
            )}
          </>
        ) : isRejected ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Pago rechazado</h1>
            <p className="text-sm text-slate-500">
              No se pudo procesar el pago. Puedes intentar nuevamente.
            </p>
            {mpStatus && (
              <p className="text-xs text-slate-400">Estado: {mpStatus}</p>
            )}
          </>
        ) : isPending ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Pago pendiente</h1>
            <p className="text-sm text-slate-500">
              Tu pago está siendo procesado. Te notificaremos cuando se complete.
            </p>
            {mpStatus && (
              <p className="text-xs text-slate-400">Estado: {mpStatus}</p>
            )}
          </>
        ) : (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Clock className="h-10 w-10 text-slate-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Procesando pago</h1>
            <p className="text-sm text-slate-500">
              Estamos verificando el estado de tu transacción.
            </p>
            {orderId && (
              <p className="text-xs text-slate-400">
                Orden: <span className="font-mono font-semibold">{orderId.slice(0, 8).toUpperCase()}</span>
              </p>
            )}
          </>
        )}

        <button
          onClick={() => window.location.href = "/"}
          className="w-full rounded-2xl bg-slate-800 py-3.5 text-sm font-bold text-white transition hover:bg-slate-700 active:scale-[0.98]"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />
        </div>
      }
    >
      <PaymentCallbackContent />
    </Suspense>
  );
}
