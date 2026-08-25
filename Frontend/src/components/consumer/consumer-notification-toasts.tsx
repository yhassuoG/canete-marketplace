"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, CheckCircle2, XCircle, X } from "lucide-react";
import { useConsumerNotifications } from "./consumer-notification-provider";

/**
 * Toast notifications for consumers (logged-in marketplace users).
 * Appears in the bottom-right corner when order status changes.
 * Auto-dismiss after 6 seconds.
 */
export function ConsumerNotificationToasts() {
  const { toasts, dismissToast } = useConsumerNotifications();

  // Auto-dismiss toasts after 6s
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) =>
      setTimeout(() => dismissToast(t.id), 6000)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismissToast]);

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.type === "payment_verified"
              ? CheckCircle2
              : toast.type === "payment_rejected"
              ? XCircle
              : Package;
          const iconBg =
            toast.type === "payment_verified"
              ? "bg-emerald-500"
              : toast.type === "payment_rejected"
              ? "bg-red-500"
              : "bg-[#083d77]";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-lg max-w-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} flex-shrink-0`}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {toast.message}
                </p>
                <p className="text-xs text-slate-400">Hace unos segundos</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="flex-shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
