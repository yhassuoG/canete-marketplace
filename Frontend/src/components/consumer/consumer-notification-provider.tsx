"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { fetchOrdersByAccount, type OrderApiResponse } from "@//lib/api";
import { getMarketplaceAccount } from "@//lib/marketplace-account";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ConsumerNotificationItem {
  id: string;
  type: "order_status" | "payment_verified" | "payment_rejected";
  orderId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface ConsumerNotificationContextValue {
  notifications: ConsumerNotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  toasts: ConsumerNotificationItem[];
  dismissToast: (id: string) => void;
}

const ConsumerNotificationContext =
  createContext<ConsumerNotificationContextValue | null>(null);

const POLL_INTERVAL = 30_000; // 30 seconds
const STORAGE_KEY = "canete_consumer_order_statuses";

// ── Status labels ────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
  pending_payment: "Esperando pago",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function ConsumerNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [notifications, setNotifications] = useState<ConsumerNotificationItem[]>(
    []
  );
  const [toasts, setToasts] = useState<ConsumerNotificationItem[]>([]);
  const accountIdRef = useRef<string | null>(null);
  const orderStatusesRef = useRef<Record<string, string>>({});
  const isFirstPollRef = useRef(true);

  // Load saved order statuses from localStorage (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        orderStatusesRef.current = JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    const account = getMarketplaceAccount();
    if (account?.id) accountIdRef.current = account.id;
  }, []);

  // Poll for order status changes
  useEffect(() => {
    let active = true;

    const poll = async () => {
      const accountId = accountIdRef.current;
      if (!accountId) return;

      try {
        const orders = await fetchOrdersByAccount(accountId);
        if (!active || orders.length === 0) return;

        const isFirst = isFirstPollRef.current;
        isFirstPollRef.current = false;

        // Build current status map
        const currentStatuses: Record<string, string> = {};
        for (const o of orders) {
          currentStatuses[o.id] = o.status;
        }

        // On first poll, just set the baseline — don't notify
        if (isFirst) {
          orderStatusesRef.current = currentStatuses;
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStatuses));
          } catch {
            // ignore
          }
          return;
        }

        // Detect status changes
        const newNotifs: ConsumerNotificationItem[] = [];
        const now = Date.now();

        for (const o of orders) {
          const prevStatus = orderStatusesRef.current[o.id];
          const newStatus = o.status;

          // New order (wasn't in previous map)
          if (prevStatus === undefined) {
            newNotifs.push({
              id: `order_new_${o.id}`,
              type: "order_status",
              orderId: o.id,
              message: `Pedido #${o.id
                .substring(0, 8)
                .toUpperCase()} registrado — ${statusLabel(newStatus)}`,
              timestamp: now,
              read: false,
            });
            continue;
          }

          // Status changed
          if (prevStatus !== newStatus) {
            // Payment verification changes
            if (
              o.paymentStatus === "APPROVED" &&
              orderStatusesRef.current[o.id + "_pay"] !== "APPROVED"
            ) {
              newNotifs.push({
                id: `pay_approved_${o.id}_${now}`,
                type: "payment_verified",
                orderId: o.id,
                message: `Pago aprobado para el pedido #${o.id
                  .substring(0, 8)
                  .toUpperCase()}`,
                timestamp: now,
                read: false,
              });
            } else if (
              o.paymentStatus === "REJECTED" &&
              orderStatusesRef.current[o.id + "_pay"] !== "REJECTED"
            ) {
              newNotifs.push({
                id: `pay_rejected_${o.id}_${now}`,
                type: "payment_rejected",
                orderId: o.id,
                message: `Pago rechazado para el pedido #${o.id
                  .substring(0, 8)
                  .toUpperCase()}`,
                timestamp: now,
                read: false,
              });
            } else {
              // Regular status change
              newNotifs.push({
                id: `order_status_${o.id}_${prevStatus}_${newStatus}`,
                type: "order_status",
                orderId: o.id,
                message: `Pedido #${o.id
                  .substring(0, 8)
                  .toUpperCase()}: ${statusLabel(prevStatus)} → ${statusLabel(
                  newStatus
                )}`,
                timestamp: now,
                read: false,
              });
            }
          }
        }

        // Update saved statuses (including payment statuses)
        const updatedStatuses: Record<string, string> = { ...currentStatuses };
        for (const o of orders) {
          if (o.paymentStatus) {
            updatedStatuses[o.id + "_pay"] = o.paymentStatus;
          }
        }
        orderStatusesRef.current = updatedStatuses;
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStatuses));
        } catch {
          // ignore
        }

        if (newNotifs.length > 0) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = newNotifs.filter((n) => !existingIds.has(n.id));
            return [...fresh, ...prev].slice(0, 50);
          });

          // Show toasts
          setToasts((prev) => [...prev, ...newNotifs]);
        }
      } catch {
        // Silently fail
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    const initialTimer = setTimeout(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(initialTimer);
    };
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ConsumerNotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        clearAll,
        toasts,
        dismissToast,
      }}
    >
      {children}
    </ConsumerNotificationContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useConsumerNotifications() {
  const ctx = useContext(ConsumerNotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadCount: 0,
      markAllRead: () => {},
      markRead: () => {},
      clearAll: () => {},
      toasts: [],
      dismissToast: () => {},
    };
  }
  return ctx;
}
