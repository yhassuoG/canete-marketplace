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
import { fetchOrdersByTenant, fetchTenant, type OrderApiResponse } from "@/lib/api";
import { getAuthUser } from "@/lib/auth";

// ── Types ────────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string;
  type: "new_order" | "payment_pending";
  orderId: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  toasts: NotificationItem[];
  dismissToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLL_INTERVAL = 30_000; // 30 seconds
const STORAGE_KEY = "canete_last_seen_order";

// ── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<NotificationItem[]>([]);
  const tenantIdRef = useRef<string | null>(null);
  const lastSeenRef = useRef<number>(
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10)
      : 0
  );
  const isFirstPollRef = useRef(true);

  // Resolve tenant
  useEffect(() => {
    const user = getAuthUser();
    if (!user?.tenantSlug) return;
    fetchTenant(user.tenantSlug).then((t) => {
      if (t?.id) tenantIdRef.current = t.id;
    });
  }, []);

  // Poll for new orders
  useEffect(() => {
    let active = true;

    const poll = async () => {
      const tenantId = tenantIdRef.current;
      if (!tenantId) return;

      try {
        const orders = await fetchOrdersByTenant(tenantId);
        if (!active || orders.length === 0) return;

        const now = Date.now();
        const isFirst = isFirstPollRef.current;
        isFirstPollRef.current = false;

        // On first poll, just set the baseline — don't notify about existing orders
        if (isFirst) {
          const newest = Math.max(...orders.map((o) => new Date(o.createdAt).getTime()));
          lastSeenRef.current = newest;
          localStorage.setItem(STORAGE_KEY, String(newest));
          return;
        }

        const newOrders: OrderApiResponse[] = [];
        const pendingPayments: OrderApiResponse[] = [];

        for (const o of orders) {
          const created = new Date(o.createdAt).getTime();
          if (created > lastSeenRef.current) {
            newOrders.push(o);
          }
          // Payment pending verification (not yet notified)
          if (o.paymentStatus === "PENDING_VERIFICATION") {
            pendingPayments.push(o);
          }
        }

        if (newOrders.length > 0) {
          const newest = Math.max(...newOrders.map((o) => new Date(o.createdAt).getTime()));
          lastSeenRef.current = newest;
          localStorage.setItem(STORAGE_KEY, String(newest));

          const newNotifs: NotificationItem[] = newOrders.map((o) => ({
            id: `new_order_${o.id}`,
            type: "new_order" as const,
            orderId: o.id,
            message: `Nuevo pedido #${o.id.substring(0, 8).toUpperCase()} de ${o.customerName}`,
            timestamp: new Date(o.createdAt).getTime(),
            read: false,
          }));

          setNotifications((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const fresh = newNotifs.filter((n) => !existingIds.has(n.id));
            return [...fresh, ...prev].slice(0, 50);
          });

          // Show toasts
          setToasts((prev) => [...prev, ...newNotifs]);
        }
      } catch {
        // Silently fail — don't disrupt the UI
      }
    };

    const interval = setInterval(poll, POLL_INTERVAL);
    // Initial poll after a short delay (let tenant resolve)
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
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead, clearAll, toasts, dismissToast }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
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
