/**
 * Cliente HTTP hacia el backend Spring Boot.
 * Configurable por entorno mediante NEXT_PUBLIC_API_URL.
 */

import type { OrderStatus, DeliveryType } from "./types";
import { getApiBase } from "./api-base";

const API_BASE = getApiBase();

// ── Tipos de respuesta ────────────────────────────────────────────────────────

export interface TenantApiData {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  category: string;
  location: string;
  plan: string;
  status: string;
  rating: number;
  reviewCount: number;
  monthlyRevenue: number;
  reservationsThisMonth: number;
  ordersThisMonth: number;
  primaryColor: string;
  gradient: string;
  description: string;
  phone: string;
  features: string[];
  // Campos dinámicos del tenant_config
  lat: number | null;
  lng: number | null;
  address: string | null;
  openingHours: string | null;
  // Configuración delivery / pickup
  allowsDelivery: boolean | null;
  allowsPickup: boolean | null;
  cashEnabled: boolean | null;
  cardEnabled: boolean | null;
  deliveryFee: number | null;
  // Yape
  yapeEnabled: boolean | null;
  yapePhone: string | null;
  yapeHolder: string | null;
  yapeQrUrl: string | null;
  // Plin
  plinEnabled: boolean | null;
  plinPhone: string | null;
  plinHolder: string | null;
  plinQrUrl: string | null;
  // Instrucciones de pago
  paymentInstructions: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  featured: boolean | null;
}

export interface UpdateTenantConfigPayload {
  name?: string;
  tagline?: string;
  description?: string;
  phone?: string;
  address?: string;
  openingHours?: string;
  lat?: string;
  lng?: string;
  primaryColor?: string;
  allowsDelivery?: boolean;
  allowsPickup?: boolean;
  cashEnabled?: boolean;
  cardEnabled?: boolean;
  deliveryFee?: string;
  // Yape
  yapeEnabled?: boolean;
  yapePhone?: string;
  yapeHolder?: string;
  yapeQrUrl?: string;
  // Plin
  plinEnabled?: boolean;
  plinPhone?: string;
  plinHolder?: string;
  plinQrUrl?: string;
  // Instrucciones
  paymentInstructions?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

export interface CreateTenantPayload {
  name: string;
  slug?: string;
  category: string;
  location: string;
  tagline?: string;
  description?: string;
  phone?: string;
  address?: string;
  lat?: string;
  lng?: string;
  primaryColor?: string;
}

interface ApiErrorPayload {
  code?: string;
  message?: string;
}

// ── Funciones ─────────────────────────────────────────────────────────────────

/**
 * Obtiene un tenant por slug desde la API.
 * Devuelve null si no está disponible o la respuesta es errónea.
 */
export async function fetchTenant(
  slug: string,
  options?: RequestInit
): Promise<TenantApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}`, {
      next: { revalidate: 30 },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as TenantApiData;
  } catch {
    return null;
  }
}

export async function fetchTenants(options?: RequestInit): Promise<TenantApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants`, {
      next: { revalidate: 30 },
      ...options,
    });
    if (!res.ok) return [];
    return (await res.json()) as TenantApiData[];
  } catch (err) {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return [];
  }
}

export async function createTenant(
  payload: CreateTenantPayload
): Promise<{ data: TenantApiData | null; conflict: boolean; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let errorBody: ApiErrorPayload | null = null;
    if (!res.ok) {
      try {
        errorBody = (await res.json()) as ApiErrorPayload;
      } catch {
        errorBody = null;
      }
    }

    if (res.status === 409) {
      return { data: null, conflict: true, message: errorBody?.message };
    }

    if (!res.ok) {
      return { data: null, conflict: false, message: errorBody?.message ?? "Unexpected server error" };
    }

    return { data: (await res.json()) as TenantApiData, conflict: false };
  } catch {
    return { data: null, conflict: false, message: "No se pudo conectar con la API" };
  }
}

/**
 * Actualiza la configuración dinámica de un tenant.
 * Devuelve el tenant actualizado o null si falla.
 */
export async function updateTenantConfig(
  slug: string,
  payload: UpdateTenantConfigPayload
): Promise<TenantApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as TenantApiData;
  } catch {
    return null;
  }
}

/**
 * Sube una imagen de portada (banner) para un tenant.
 * Envía el archivo como multipart/form-data al backend.
 * Devuelve la URL pública del banner o null si falla.
 */
export async function uploadTenantBanner(
  slug: string,
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/tenants/${slug}/config/banner`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { bannerUrl?: string };
    return data.bannerUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Sube un logo (imagen de perfil circular) para un tenant.
 * Devuelve la URL pública del logo o null si falla.
 */
export async function uploadTenantLogo(
  slug: string,
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/tenants/${slug}/config/logo`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { logoUrl?: string };
    return data.logoUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Sube el QR de Yape para un tenant.
 * Devuelve la URL pública del QR o null si falla.
 */
export async function uploadYapeQr(
  slug: string,
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/tenants/${slug}/config/yape-qr`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { yapeQrUrl?: string };
    return data.yapeQrUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Sube el QR de Plin para un tenant.
 * Devuelve la URL pública del QR o null si falla.
 */
export async function uploadPlinQr(
  slug: string,
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/tenants/${slug}/config/plin-qr`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { plinQrUrl?: string };
    return data.plinQrUrl ?? null;
  } catch {
    return null;
  }
}

// ── Payment Proofs (Yape/Plin nativo) ───────────────────────────────────────

export interface PaymentProofApiData {
  id: string;
  orderId: string;
  tenantId: string;
  customerId: string | null;
  paymentMethod: string;
  fileUrl: string;
  fileName: string | null;
  fileSize: number | null;
  status: string;               // PENDING_VERIFICATION | APPROVED | REJECTED
  rejectionReason: string | null;
  uploadedBy: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Sube comprobante de pago (Yape/Plin nativo).
 * POST /api/v1/payments/{orderId}/receipt  (multipart: file)
 */
export async function uploadPaymentReceipt(
  orderId: string,
  file: File,
  customerId?: string,
  customerName?: string
): Promise<PaymentProofApiData | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (customerId) formData.append("customerId", customerId);
    if (customerName) formData.append("customerName", customerName);

    const res = await fetch(`${API_BASE}/api/v1/payments/${orderId}/receipt`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    return (await res.json()) as PaymentProofApiData;
  } catch {
    return null;
  }
}

/** Lista comprobantes de un pedido. */
export async function fetchPaymentProofs(
  orderId: string
): Promise<PaymentProofApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/${orderId}/receipt`);
    if (!res.ok) return [];
    return (await res.json()) as PaymentProofApiData[];
  } catch {
    return [];
  }
}

/** Comprobantes pendientes de verificación para un tenant (panel del negocio). */
export async function fetchPendingPaymentProofs(
  tenantId: string
): Promise<PaymentProofApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/pending/${tenantId}`);
    if (!res.ok) return [];
    return (await res.json()) as PaymentProofApiData[];
  } catch {
    return [];
  }
}

/** Todos los comprobantes de un tenant (historial). */
export async function fetchAllPaymentProofs(
  tenantId: string
): Promise<PaymentProofApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/proofs/${tenantId}`);
    if (!res.ok) return [];
    return (await res.json()) as PaymentProofApiData[];
  } catch {
    return [];
  }
}

/** Todos los comprobantes pendientes (admin global). */
export async function fetchAllPendingProofs(): Promise<PaymentProofApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/pending`);
    if (!res.ok) return [];
    return (await res.json()) as PaymentProofApiData[];
  } catch {
    return [];
  }
}

/** Confirma un comprobante (negocio aprueba el pago). */
export async function confirmPaymentProof(
  proofId: string,
  verifiedBy?: string
): Promise<PaymentProofApiData | null> {
  try {
    const params = verifiedBy ? `?verifiedBy=${verifiedBy}` : "";
    const res = await fetch(`${API_BASE}/api/v1/payments/proofs/${proofId}/confirm${params}`, {
      method: "POST",
    });
    if (!res.ok) return null;
    return (await res.json()) as PaymentProofApiData;
  } catch {
    return null;
  }
}

/** Rechaza un comprobante (negocio rechaza el pago). */
export async function rejectPaymentProof(
  proofId: string,
  reason: string,
  verifiedBy?: string
): Promise<PaymentProofApiData | null> {
  try {
    const params = verifiedBy ? `?verifiedBy=${verifiedBy}` : "";
    const res = await fetch(`${API_BASE}/api/v1/payments/proofs/${proofId}/reject${params}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) return null;
    return (await res.json()) as PaymentProofApiData;
  } catch {
    return null;
  }
}

// ── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  imageUrl: string | null;
  available: boolean;
  stock: number | null;
  sortOrder: number;
}

export interface ProductPayload {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  available?: boolean;
  stock?: number | null;
  sortOrder?: number;
}

/** Lista los productos de un tenant. */
export async function fetchProducts(tenantSlug: string): Promise<Product[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/${tenantSlug}/products`);
    if (!res.ok) return null;
    return (await res.json()) as Product[];
  } catch {
    return null;
  }
}

/** Crea un producto para un tenant. */
export async function createProduct(
  tenantSlug: string,
  payload: ProductPayload
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/${tenantSlug}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

/** Actualiza un producto de un tenant. */
export async function updateProduct(
  tenantSlug: string,
  productId: string,
  payload: ProductPayload
): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/${tenantSlug}/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as Product;
  } catch {
    return null;
  }
}

/** Elimina un producto de un tenant. */
export async function deleteProduct(
  tenantSlug: string,
  productId: string
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/catalog/${tenantSlug}/products/${productId}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Sube una imagen para un producto.
 * Devuelve la URL pública de la imagen o null si falla.
 */
export async function uploadProductImage(
  tenantSlug: string,
  productId: string,
  file: File
): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/v1/catalog/${tenantSlug}/products/${productId}/image`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { imageUrl?: string };
    return data.imageUrl ?? null;
  } catch {
    return null;
  }
}

// ── Orders ────────────────────────────────────────────────────────────────────

export interface OrderItemApi {
  productId?: string;
  name: string;
  price: number;
  qty: number;
}

export interface CreateOrderPayload {
  tenantId: string;
  customerId?: string;
  accountId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryType: "pickup" | "delivery";
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  items: OrderItemApi[];
}

export interface OrderApiResponse {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  status: OrderStatus;
  deliveryType: DeliveryType;
  paymentMethod: string | null;
  paymentReference: string | null;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes: string | null;
  // Mercado Pago
  mpPreferenceId: string | null;
  mpInitPoint: string | null;
  mpPaymentId: number | null;
  mpPaymentStatus: string | null;
  // Yape/Plin native payment verification
  paymentStatus: string | null;          // PENDING_VERIFICATION | APPROVED | REJECTED
  paymentReceiptUrl: string | null;
  paymentVerifiedBy: string | null;
  paymentVerifiedAt: string | null;
  paymentRejectedAt: string | null;
  paymentRejectedBy: string | null;
  paymentRejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }[];
}

/** Crea un pedido en el backend. Dispara notificación WhatsApp de confirmación. */
export async function createOrder(
  payload: CreateOrderPayload
): Promise<OrderApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as OrderApiResponse;
  } catch {
    return null;
  }
}

/** Obtiene un pedido por ID. */
export async function fetchOrder(orderId: string): Promise<OrderApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}`);
    if (!res.ok) return null;
    return (await res.json()) as OrderApiResponse;
  } catch {
    return null;
  }
}

// ── Mercado Pago ────────────────────────────────────────────────────────────

export interface CreatePreferenceResponse {
  preferenceId: string;
  initPoint: string;  // URL de checkout a la que redirigir
  sandbox: boolean;
}

export interface PaymentStatusResponse {
  orderId: string;
  status: string;            // pending_payment | confirmed | payment_rejected | ...
  mpPaymentStatus: string;   // pending | approved | rejected | ...
  mpPaymentId: number;
  mpPreferenceId: string;
}

/**
 * Crea una preferencia de pago en Mercado Pago para un pedido.
 * Devuelve la URL de checkout (initPoint) a la que redirigir al cliente.
 */
export async function createPaymentPreference(
  orderId: string
): Promise<CreatePreferenceResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/create-preference/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as CreatePreferenceResponse;
  } catch {
    return null;
  }
}

/**
 * Consulta el estado de pago de un pedido (para polling después de MP).
 */
export async function getPaymentStatus(
  orderId: string
): Promise<PaymentStatusResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/payments/status/${orderId}`);
    if (!res.ok) return null;
    return (await res.json()) as PaymentStatusResponse;
  } catch {
    return null;
  }
}

/** Lista los pedidos de un tenant. */
export async function fetchOrdersByTenant(
  tenantId: string
): Promise<OrderApiResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders?tenantId=${tenantId}`);
    if (!res.ok) return [];
    return (await res.json()) as OrderApiResponse[];
  } catch {
    return [];
  }
}

/** Lista todos los pedidos de la plataforma (admin). */
export async function fetchAllOrders(): Promise<OrderApiResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/all`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as OrderApiResponse[];
  } catch {
    return [];
  }
}

/** Lista los pedidos de un cliente. */
export async function fetchOrdersByCustomer(
  customerId: string
): Promise<OrderApiResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/customer/${customerId}`);
    if (!res.ok) return [];
    return (await res.json()) as OrderApiResponse[];
  } catch {
    return [];
  }
}

/** Lista todos los pedidos de una cuenta de marketplace (consumidor logeado). */
export async function fetchOrdersByAccount(
  accountId: string
): Promise<OrderApiResponse[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/account/${accountId}`);
    if (!res.ok) return [];
    return (await res.json()) as OrderApiResponse[];
  } catch {
    return [];
  }
}

/**
 * Actualiza el estado de un pedido.
 * Dispara notificación WhatsApp:
 *   - → "on_the_way": "pedido en camino" (delivery)
 *   - → "confirmed" + pickup: "pedido listo para recoger"
 */
export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<OrderApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return null;
    return (await res.json()) as OrderApiResponse;
  } catch {
    return null;
  }
}

// ── Analytics ────────────────────────────────────────────────────────────────

export interface GlobalAnalytics {
  totalRevenue: number;
  revenueGrowth: number;
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  newUsersThisMonth: number;
  totalTransactions: number;
  avgTicket: number;
}

export interface RevenueSeriesEntry {
  date: string;
  revenue: number;
  orders: number;
  reservations: number;
}

export interface CategoryBreakdownEntry {
  category: string;
  value: number;
  color: string;
}

export interface BusinessAnalytics {
  slug: string;
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

/** Obtiene las métricas globales de la plataforma. */
export async function fetchGlobalAnalytics(): Promise<GlobalAnalytics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/global`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as GlobalAnalytics;
  } catch {
    return null;
  }
}

/** Obtiene la serie de ingresos de las últimas 4 semanas. */
export async function fetchRevenueSeries(): Promise<RevenueSeriesEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/global/revenue-series`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as RevenueSeriesEntry[];
  } catch {
    return [];
  }
}

/** Obtiene el desglose de empresas por categoría. */
export async function fetchCategoryBreakdown(): Promise<CategoryBreakdownEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/global/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as CategoryBreakdownEntry[];
  } catch {
    return [];
  }
}

export interface TopTenantEntry {
  name: string;
  slug: string;
  revenue: number;
  growth: number;
  plan: string;
}

/** Obtiene el top de empresas por ingresos. */
export async function fetchTopTenants(): Promise<TopTenantEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/global/top-tenants`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as TopTenantEntry[];
  } catch {
    return [];
  }
}

/** Obtiene las métricas de un negocio por slug. */
export async function fetchBusinessAnalytics(
  slug: string
): Promise<BusinessAnalytics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/${slug}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as BusinessAnalytics;
  } catch {
    return null;
  }
}

export interface TenantMonthlyEntry {
  month: string;
  sales: number;
  customers: number;
  reservations: number;
}

export interface TenantWeeklyEntry {
  day: string;
  sales: number;
  orders: number;
}

export interface TenantPeakHourEntry {
  hour: string;
  pax: number;
}

/** Serie mensual de un negocio (últimos 6 meses). */
export async function fetchTenantMonthlySeries(
  slug: string
): Promise<TenantMonthlyEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/${slug}/monthly-series`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as TenantMonthlyEntry[];
  } catch {
    return [];
  }
}

/** Serie semanal de un negocio (últimos 7 días). */
export async function fetchTenantWeeklySeries(
  slug: string
): Promise<TenantWeeklyEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/${slug}/weekly-series`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as TenantWeeklyEntry[];
  } catch {
    return [];
  }
}

/** Horas pico de un negocio. */
export async function fetchTenantPeakHours(
  slug: string
): Promise<TenantPeakHourEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/${slug}/peak-hours`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as TenantPeakHourEntry[];
  } catch {
    return [];
  }
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface CustomerApiData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  visits: number;
  spent: number;
  loyaltyPoints: number;
  loyalty: string;
  joinedDate: string | null;
}

/** Lista los clientes de un tenant por slug. */
export async function fetchCustomersByTenant(
  tenantSlug: string
): Promise<CustomerApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/customers?tenantSlug=${tenantSlug}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as CustomerApiData[];
  } catch {
    return [];
  }
}

/** Lista todos los clientes de la plataforma (admin). */
export async function fetchAllCustomers(): Promise<CustomerApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/customers`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as CustomerApiData[];
  } catch {
    return [];
  }
}

// ── Reservations ─────────────────────────────────────────────────────────────

export interface ReservationApiData {
  id: string;
  tenantId: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceType: string;
  guests: number;
  reservationDate: string | null;
  reservationTime: string | null;
  status: string;
  subtotal: number;
  serviceFee: number;
  total: number;
  notes: string | null;
}

/** Lista las reservas de un tenant por slug. */
export async function fetchReservationsByTenant(
  tenantSlug: string
): Promise<ReservationApiData[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/reservations?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return (await res.json()) as ReservationApiData[];
  } catch {
    return [];
  }
}

// ── Coupons ──────────────────────────────────────────────────────────────────

export interface CouponApiData {
  id: string;
  tenantId: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

/** Lista los cupones de un tenant por slug. */
export async function fetchCouponsByTenant(
  tenantSlug: string
): Promise<CouponApiData[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/coupons?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    return (await res.json()) as CouponApiData[];
  } catch {
    return [];
  }
}

// ── Users ────────────────────────────────────────────────────────────────────

export interface UserApiData {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  tenantSlug: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

/** Lista todos los usuarios del sistema. */
export async function fetchUsers(): Promise<UserApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as UserApiData[];
  } catch {
    return [];
  }
}

// ── Mercado Pago config (tenant) ─────────────────────────────────────────────

export interface MpConfigApiData {
  mpPublicKey: string | null;
  mpUserId: string | null;
  mpSandbox: boolean;
  mpEnabled: boolean;
  mpUpdatedAt: string | null;
}

export interface UpdateMpConfigPayload {
  mpAccessToken?: string;
  mpPublicKey?: string;
  mpUserId?: string;
  mpSandbox?: boolean;
  mpEnabled?: boolean;
}

/** Obtiene la configuración de Mercado Pago de un tenant. */
export async function getTenantMpConfig(
  slug: string
): Promise<MpConfigApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/mp-config`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as MpConfigApiData;
  } catch {
    return null;
  }
}

/** Guarda las credenciales de Mercado Pago de un tenant. */
export async function updateTenantMpConfig(
  slug: string,
  payload: UpdateMpConfigPayload
): Promise<MpConfigApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/mp-config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as MpConfigApiData;
  } catch {
    return null;
  }
}

// ── Plans (super admin) ──────────────────────────────────────────────────────

export interface PlanApiData {
  id: string;
  name: string;
  displayName: string;
  priceMonthly: number;
  maxProducts: number;
  maxOrdersPerMonth: number;
  trialDays: number;
  hasMp: boolean;
  maxMpSalesMonth: number;
  isActive: boolean;
  sortOrder: number;
}

export interface UpdatePlanPayload {
  displayName?: string;
  priceMonthly?: number;
  maxProducts?: number;
  maxOrdersPerMonth?: number;
  trialDays?: number;
  hasMp?: boolean;
  maxMpSalesMonth?: number;
  isActive?: boolean;
  sortOrder?: number;
}

/** Lista todos los planes activos (super admin). */
export async function fetchPlans(): Promise<PlanApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as PlanApiData[];
  } catch {
    return [];
  }
}

/** Actualiza un plan por nombre (super admin). */
export async function updatePlan(
  name: string,
  payload: UpdatePlanPayload
): Promise<PlanApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/plans/${name}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return (await res.json()) as PlanApiData;
  } catch {
    return null;
  }
}

// ── Contenido editorial: distritos, noticias, eventos ─────────────────────────

export interface DistrictApiData {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  region: string;
  sortOrder: number;
  placesCount: number;
}

export interface NewsApiData {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  imageUrl: string | null;
  category: string;
  districtSlug: string | null;
  publishedAt: string;
}

export interface EventApiData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  category: string;
  districtSlug: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  featured: boolean;
}

/** Lista los distritos de la provincia de Cañete (datos reales de la BD). */
export async function fetchDistricts(): Promise<DistrictApiData[]> {
  try {
    const url = `${API_BASE}/api/v1/content/districts`;
    const res = await fetch(url, {
      cache: typeof window === "undefined" ? "no-store" : "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as DistrictApiData[];
  } catch (err) {
    // Re-throw Next.js dynamic server usage errors so the route is rendered dynamically
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return [];
  }
}

/** Obtiene un distrito por slug. */
export async function fetchDistrict(slug: string): Promise<DistrictApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/districts/${slug}`, {
      cache: typeof window === "undefined" ? "force-cache" : "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as DistrictApiData;
  } catch {
    return null;
  }
}

/** Lista las noticias del portal, más recientes primero. */
export async function fetchNews(): Promise<NewsApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/news`, {
      cache: typeof window === "undefined" ? "no-store" : "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as NewsApiData[];
  } catch (err) {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return [];
  }
}

/** Obtiene una noticia por slug. */
export async function fetchNewsBySlug(slug: string): Promise<NewsApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/news/${slug}`, {
      cache: typeof window === "undefined" ? "no-store" : "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as NewsApiData;
  } catch (err) {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return null;
  }
}

/** Lista los eventos y festividades, ordenados por fecha. */
export async function fetchEvents(): Promise<EventApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/events`, {
      cache: typeof window === "undefined" ? "no-store" : "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as EventApiData[];
  } catch (err) {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return [];
  }
}

/** Obtiene un evento por slug. */
export async function fetchEventBySlug(slug: string): Promise<EventApiData | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/events/${slug}`, {
      cache: typeof window === "undefined" ? "no-store" : "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as EventApiData;
  } catch (err) {
    if (err instanceof Error && (err as Error & { digest?: string }).digest === "DYNAMIC_SERVER_USAGE") throw err;
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN CRUD — Superadmin panel (WordPress-like)
// ═══════════════════════════════════════════════════════════════════════════════

// ── Users ─────────────────────────────────────────────────────────────────────

export interface CreateUserPayload {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "business_owner" | "customer";
  tenantSlug?: string | null;
}

export interface UpdateUserPayload {
  email?: string;
  fullName?: string;
  role?: "admin" | "business_owner" | "customer";
  tenantSlug?: string | null;
  status?: "active" | "suspended";
  password?: string | null;
}

export async function createUser(payload: CreateUserPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteUser(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function setUserStatus(id: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Tenants (admin) ──────────────────────────────────────────────────────────

export async function fetchAllTenantsIncludingSuspended(): Promise<TenantApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/all`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as TenantApiData[];
  } catch {
    return [];
  }
}

export async function deleteTenant(slug: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function setTenantStatus(slug: string, status: "active" | "suspended"): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function changeTenantPlan(
  slug: string,
  plan: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/plan`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function setTenantFeatured(
  slug: string,
  featured: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/${slug}/featured`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function fetchFeaturedTenants(): Promise<TenantApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/tenants/featured`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as TenantApiData[];
  } catch {
    return [];
  }
}

// ── Generic image upload ─────────────────────────────────────────────────────

export async function uploadImage(file: File, type: string, name?: string): Promise<{ url: string } | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const params = new URLSearchParams({ type });
    if (name) params.append("name", name);
    const res = await fetch(`${API_BASE}/api/admin/upload?${params}`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    return (await res.json()) as { url: string };
  } catch {
    return null;
  }
}

// ── Districts CRUD ───────────────────────────────────────────────────────────

export interface DistrictPayload {
  slug: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  region?: string | null;
  sortOrder?: number | null;
}

export async function createDistrict(payload: DistrictPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/districts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateDistrict(id: string, payload: DistrictPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/districts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteDistrict(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/districts/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Platform Settings / Maintenance Mode ─────────────────────────────────────

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

/**
 * Obtiene el estado actual del modo mantenimiento.
 * Devuelve { enabled: false, message: "..." } si la API no responde.
 */
export async function fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
  try {
    const res = await fetch(`${API_BASE}/api/settings/maintenance`, { cache: "no-store" });
    if (!res.ok) return { enabled: false, message: "" };
    return (await res.json()) as MaintenanceStatus;
  } catch {
    return { enabled: false, message: "" };
  }
}

/**
 * Activa o desactiva el modo mantenimiento.
 */
export async function setMaintenanceMode(
  enabled: boolean,
  message?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const body: Record<string, unknown> = { enabled };
    if (message !== undefined) body.message = message;
    const res = await fetch(`${API_BASE}/api/settings/maintenance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}


// ── News CRUD ────────────────────────────────────────────────────────────────

export interface NewsPayload {
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  districtSlug?: string | null;
  publishedAt?: string | null;
}

export async function createNews(payload: NewsPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateNews(id: string, payload: NewsPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/news/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteNews(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/news/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Events CRUD ──────────────────────────────────────────────────────────────

export interface EventPayload {
  slug: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  category?: string | null;
  districtSlug?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  featured?: boolean | null;
}

export async function createEvent(payload: EventPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateEvent(id: string, payload: EventPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/events/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteEvent(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/content/admin/events/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  FACTURACIÓN ELECTRÓNICA SUNAT
// ════════════════════════════════════════════════════════════════════════════

export interface TenantTaxConfig {
  id?: string;
  tenantId?: string;
  ruc: string;
  razonSocial: string;
  nombreComercial?: string;
  domicilioFiscal: string;
  ubigeo: string;
  urbanizacion?: string;
  distrito: string;
  provincia: string;
  departamento: string;
  codigoPais?: string;
  igvRate?: number;
  serieBoleta?: string;
  serieFactura?: string;
  certBase64?: string;
  certPassword?: string;
  certAlias?: string;
  sunatMode?: string;
  solUser?: string;
  solPassword?: string;
  enabled: boolean;
}

export interface Invoice {
  id: string;
  tenantId: string;
  orderId?: string;
  type: string;
  serie: string;
  number: number;
  documentNumber: string;
  customerDocType: string;
  customerDocNumber: string;
  customerName: string;
  total: number;
  taxableBase: number;
  igvAmount: number;
  status: string;
  cdrCode?: string;
  cdrDescription?: string;
  sunatError?: string;
  issueDate: string;
  createdAt: string;
}

/** Obtiene la configuración tributaria de un tenant */
export async function getTaxConfig(tenantId: string): Promise<TenantTaxConfig | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/config/${tenantId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.ruc) return null;
    return data;
  } catch {
    return null;
  }
}

/** Guarda la configuración tributaria de un tenant */
export async function saveTaxConfig(tenantId: string, config: TenantTaxConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/config/${tenantId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      return { ok: false, error: data?.error || `Error ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Habilita/deshabilita la facturación de un tenant */
export async function toggleInvoicingEnabled(tenantId: string, enabled: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/config/${tenantId}/enabled`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Emite una factura/boleta desde una orden */
export async function issueInvoice(
  orderId: string,
  type: "factura" | "boleta",
  customerDocType: string,
  customerDocNumber: string
): Promise<{ ok: boolean; invoice?: Invoice; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, type, customerDocType, customerDocNumber }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error || `Error ${res.status}` };
    return { ok: true, invoice: data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Lista las facturas de un tenant */
export async function listInvoicesByTenant(tenantId: string): Promise<Invoice[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/tenant/${tenantId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** Lista las facturas de una orden */
export async function listInvoicesByOrder(orderId: string): Promise<Invoice[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/invoicing/order/${orderId}`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/** URL para descargar PDF de una factura */
export function getInvoicePdfUrl(invoiceId: string): string {
  return `${API_BASE}/api/v1/invoicing/${invoiceId}/pdf`;
}

/** URL para descargar XML de una factura */
export function getInvoiceXmlUrl(invoiceId: string): string {
  return `${API_BASE}/api/v1/invoicing/${invoiceId}/xml`;
}

// ── Rewards (configurable by admin) ──────────────────────────────────────────

export interface RewardApiData {
  id: string;
  tenantId: string | null;
  title: string;
  description: string | null;
  costPoints: number;
  emoji: string;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Public: list active rewards (optionally filtered by tenant) */
export async function fetchRewards(tenantSlug?: string): Promise<RewardApiData[]> {
  try {
    const params = tenantSlug ? `?tenantSlug=${encodeURIComponent(tenantSlug)}` : "";
    const res = await fetch(`${API_BASE}/api/v1/rewards${params}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as RewardApiData[];
  } catch {
    return [];
  }
}

/** Admin: list all rewards */
export async function fetchAllRewards(): Promise<RewardApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/rewards/all`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as RewardApiData[];
  } catch {
    return [];
  }
}

export interface RewardPayload {
  tenantId?: string | null;
  title: string;
  description?: string | null;
  costPoints: number;
  emoji?: string;
  imageUrl?: string | null;
}

export async function createReward(payload: RewardPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/rewards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateReward(id: string, payload: Partial<RewardPayload> & { isActive?: boolean }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/rewards/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteReward(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/rewards/${id}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── Addresses (customer delivery addresses) ─────────────────────────────────

export interface AddressApiData {
  id: string;
  accountId: string;
  label: string;
  recipientName: string | null;
  phone: string | null;
  addressLine: string;
  reference: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
}

export async function fetchAddresses(accountId: string): Promise<AddressApiData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/addresses?accountId=${accountId}`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as AddressApiData[];
  } catch {
    return [];
  }
}

export interface AddressPayload {
  label: string;
  recipientName?: string | null;
  phone?: string | null;
  addressLine: string;
  reference?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export async function createAddress(accountId: string, payload: AddressPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/addresses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, ...payload }),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function updateAddress(id: string, accountId: string, payload: Partial<AddressPayload>): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/addresses/${id}?accountId=${accountId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function deleteAddress(id: string, accountId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/addresses/${id}?accountId=${accountId}`, { method: "DELETE" });
    if (!res.ok) return { ok: false, error: `Error ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
