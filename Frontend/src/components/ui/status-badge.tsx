import { clsx } from "clsx";
import type { TenantStatus, TenantPlan, ReservationStatus, OrderStatus } from "@/lib/types";

const STATUS_STYLES: Record<TenantStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  trial: "bg-blue-50 text-blue-700 border-blue-200",
};

const PLAN_STYLES: Record<TenantPlan, string> = {
  free: "bg-slate-100 text-slate-600 border-slate-200",
  starter: "bg-sky-50 text-sky-700 border-sky-200",
  premium: "bg-violet-50 text-violet-700 border-violet-200",
  enterprise: "bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 border-orange-200",
};

const RESERVATION_STYLES: Record<ReservationStatus, string> = {
  confirmed: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-600",
  completed: "bg-slate-100 text-slate-600",
};

const ORDER_STYLES: Record<OrderStatus, string> = {
  pending: "bg-blue-50 text-blue-700",
  confirmed: "bg-sky-50 text-sky-700",
  preparing: "bg-amber-50 text-amber-700",
  on_the_way: "bg-violet-50 text-violet-700",
  ready_for_pickup: "bg-teal-50 text-teal-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-600",
  payment_rejected: "bg-red-50 text-red-600",
};

const LABELS: Record<string, string> = {
  active: "Activo",
  suspended: "Suspendido",
  pending: "Recibido",
  trial: "Prueba",
  free: "Gratis",
  starter: "Starter",
  premium: "Premium",
  enterprise: "Enterprise",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Completado",
  preparing: "Preparando",
  on_the_way: "En camino",
  ready_for_pickup: "Listo p/ recoger",
  delivered: "Entregado",
  payment_rejected: "Pago rechazado",
};

interface StatusBadgeProps {
  status: TenantStatus | TenantPlan | ReservationStatus | OrderStatus;
  type?: "status" | "plan" | "reservation" | "order";
  className?: string;
}

export function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const styles =
    type === "plan"
      ? PLAN_STYLES[status as TenantPlan]
      : type === "reservation"
      ? RESERVATION_STYLES[status as ReservationStatus]
      : type === "order"
      ? ORDER_STYLES[status as OrderStatus]
      : STATUS_STYLES[status as TenantStatus];

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        styles,
        className
      )}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
