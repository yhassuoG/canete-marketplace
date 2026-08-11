// ─── Tenant / Company ────────────────────────────────────────────────────────

export type TenantStatus = "active" | "suspended" | "pending" | "trial";
export type TenantPlan = "free" | "starter" | "premium" | "enterprise";
export type TenantCategory =
  | "restaurant"
  | "hotel"
  | "tour"
  | "experience"
  | "retail"
  | "event"
  | "winery"
  | "other";

export interface TenantTheme {
  primary: string;
  primaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  gradient: string;
  heroGradient: string;
  heroImage?: string;
  logo?: string;
  borderRadius?: "sharp" | "rounded" | "pill";
  layoutStyle?: "minimal" | "bold" | "classic";
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: TenantCategory;
  location: string;
  plan: TenantPlan;
  status: TenantStatus;
  rating: number;
  reviewCount: number;
  monthlyRevenue: number;
  reservationsThisMonth: number;
  ordersThisMonth: number;
  theme: TenantTheme;
  createdAt: string;
  owner: string;
  phone?: string;
  email?: string;
  features: TenantFeature[];
  description: string;
  // Dynamic fields synced from the database (tenant_config table)
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  // Delivery / pickup configuration
  allowsDelivery?: boolean | null;
  allowsPickup?: boolean | null;
  deliveryFee?: number | null;
  yapePhone?: string | null;
  yapeQrUrl?: string | null;
  /** Logo circular del tenant (subido por el dueño). URL relativa: /uploads/tenants/{slug}/logo.png */
  logoUrl?: string | null;
}

export type TenantFeature =
  | "reservations"
  | "delivery"
  | "tickets"
  | "catalog"
  | "reviews"
  | "loyalty"
  | "campaigns";

// ─── Analytics / Metrics ──────────────────────────────────────────────────────

export interface GlobalMetrics {
  totalRevenue: number;
  revenueGrowth: number;
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  newUsersThisMonth: number;
  totalTransactions: number;
  avgTicket: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  orders: number;
  reservations: number;
}

export interface CategoryBreakdown {
  category: string;
  value: number;
  color: string;
}

export interface BusinessMetrics {
  totalSales: number;
  salesGrowth: number;
  totalReservations: number;
  reservationGrowth: number;
  totalCustomers: number;
  customerGrowth: number;
  totalOrders: number;
  orderGrowth: number;
  avgRating: number;
}

export interface WeeklyPoint {
  day: string;
  sales: number;
  reservations: number;
  orders: number;
}

// ─── Reservations / Orders ───────────────────────────────────────────────────

export type ReservationStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "completed";

export interface Reservation {
  id: string;
  customerName: string;
  customerAvatar?: string;
  service: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  amount: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "ready_for_pickup"
  | "delivered"
  | "cancelled";

export type DeliveryType = "delivery" | "pickup";

export interface DeliveryOrder {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: OrderStatus;
  estimatedTime: number;
  address: string;
  driverName?: string;
}

// ─── Catalog / Products ───────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  reviewCount: number;
  badge?: "popular" | "new" | "offer";
  available: boolean;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "support" | "finance";
  avatarUrl?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  target: string;
  timestamp: string;
  severity: "info" | "warning" | "error";
}
