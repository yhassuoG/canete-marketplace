import type { TenantApiData } from "./api";
import type { Tenant, TenantTheme } from "./types";

// ─── Theme presets ────────────────────────────────────────────────────────────

export const THEMES: Record<string, TenantTheme> = {
  default: {
    primary: "#083d77",
    primaryLight: "#1a5ba8",
    accent: "#ff7a59",
    background: "#f8f4ea",
    surface: "#ffffff",
    text: "#101828",
    textMuted: "#6b7280",
    border: "#e5e7eb",
    gradient: "linear-gradient(135deg, #083d77 0%, #1a5ba8 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(8,61,119,0.92) 0%, rgba(26,91,168,0.85) 100%)",
  },
  "muelle-pacifico": {
    primary: "#0c4a6e",
    primaryLight: "#0369a1",
    accent: "#f97316",
    background: "#fff7ed",
    surface: "#ffffff",
    text: "#0c0a09",
    textMuted: "#78716c",
    border: "#fed7aa",
    gradient: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 60%, #0891b2 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(12,74,110,0.93) 0%, rgba(8,145,178,0.82) 100%)",
    heroImage:
      "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80",
  },
  "paraiso-lunahuana": {
    primary: "#14532d",
    primaryLight: "#16a34a",
    accent: "#fbbf24",
    background: "#f0fdf4",
    surface: "#ffffff",
    text: "#0f172a",
    textMuted: "#4b5563",
    border: "#bbf7d0",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(20,83,45,0.93) 0%, rgba(22,163,74,0.82) 100%)",
    heroImage:
      "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1600&q=80",
  },
  "vina-del-sol": {
    primary: "#7c1d1d",
    primaryLight: "#b91c1c",
    accent: "#d97706",
    background: "#fdf4e7",
    surface: "#ffffff",
    text: "#1c1917",
    textMuted: "#78716c",
    border: "#fecdd3",
    gradient: "linear-gradient(135deg, #7c1d1d 0%, #b91c1c 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(124,29,29,0.93) 0%, rgba(185,28,28,0.85) 100%)",
    heroImage:
      "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=1600&q=80",
  },
  "hotel-luna": {
    primary: "#1e1b4b",
    primaryLight: "#4338ca",
    accent: "#f59e0b",
    background: "#fafaf9",
    surface: "#ffffff",
    text: "#0f0f0f",
    textMuted: "#6b7280",
    border: "#e0e7ff",
    gradient: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(67,56,202,0.88) 100%)",
    heroImage:
      "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=1600&q=80",
  },
  "alfajores": {
    primary: "#7c2d12",
    primaryLight: "#b45309",
    accent: "#f59e0b",
    background: "#fffbeb",
    surface: "#ffffff",
    text: "#1c1917",
    textMuted: "#78716c",
    border: "#fde68a",
    gradient: "linear-gradient(135deg, #7c2d12 0%, #b45309 100%)",
    heroGradient:
      "linear-gradient(135deg, rgba(124,45,18,0.88) 0%, rgba(180,83,9,0.78) 100%)",
    heroImage: "/zelita-portada.png",
  },
};

// ─── Preset swatches shown in theme builder ───────────────────────────────────

export const PRESET_SWATCHES = [
  { id: "ocean", label: "Océano", primary: "#0c4a6e", accent: "#f97316" },
  { id: "forest", label: "Bosque", primary: "#14532d", accent: "#fbbf24" },
  { id: "wine", label: "Viña", primary: "#7c1d1d", accent: "#d97706" },
  { id: "twilight", label: "Crepúsculo", primary: "#312e81", accent: "#f43f5e" },
  { id: "aurora", label: "Aurora", primary: "#065f46", accent: "#8b5cf6" },
  { id: "midnight", label: "Medianoche", primary: "#0f172a", accent: "#38bdf8" },
];

// ─── Mock tenant data ─────────────────────────────────────────────────────────

export const TENANTS: Tenant[] = [
  {
    id: "1",
    slug: "muelle-pacifico",
    name: "Muelle Pacifico",
    tagline: "La mejor cocina marina de Cañete",
    category: "restaurant",
    location: "San Vicente de Cañete",
    plan: "premium",
    status: "active",
    rating: 4.9,
    reviewCount: 312,
    monthlyRevenue: 12450,
    reservationsThisMonth: 89,
    ordersThisMonth: 245,
    description:
      "Restaurante de cocina marina y criolla ubicado frente al mar. Especialidad en ceviche, tiradito y mariscos frescos del día.",
    theme: THEMES["muelle-pacifico"],
    createdAt: "2024-01-15",
    owner: "Carlos Muelle",
    phone: "+51 987 654 321",
    email: "hola@muellepacifico.pe",
    features: ["reservations", "delivery", "catalog", "reviews", "loyalty"],
  },
  {
    id: "2",
    slug: "paraiso-lunahuana",
    name: "Paraiso Lunahuana",
    tagline: "Aventura y naturaleza en el valle",
    category: "hotel",
    location: "Lunahuana",
    plan: "premium",
    status: "active",
    rating: 4.8,
    reviewCount: 198,
    monthlyRevenue: 18900,
    reservationsThisMonth: 47,
    ordersThisMonth: 0,
    description:
      "Lodge de aventura rodeado de naturaleza. Actividades de rafting, tirolesa y senderismo con vistas al río Cañete.",
    theme: THEMES["paraiso-lunahuana"],
    createdAt: "2024-02-01",
    owner: "Ana Torres",
    phone: "+51 986 543 210",
    email: "reservas@paraisolunahuana.pe",
    features: ["reservations", "tickets", "catalog", "reviews"],
  },
  {
    id: "3",
    slug: "vina-del-sol",
    name: "Viña del Sol",
    tagline: "Enoturismo en el corazón de Cañete",
    category: "winery",
    location: "Nuevo Imperial",
    plan: "starter",
    status: "active",
    rating: 4.7,
    reviewCount: 143,
    monthlyRevenue: 7200,
    reservationsThisMonth: 32,
    ordersThisMonth: 67,
    description:
      "Viña boutique con tradición familiar de más de 60 años. Tours por los viñedos, degustaciones y maridaje gourmet.",
    theme: THEMES["vina-del-sol"],
    createdAt: "2024-03-10",
    owner: "Luis Vargas",
    phone: "+51 985 432 109",
    email: "tours@vinadelsolcanete.pe",
    features: ["reservations", "tickets", "catalog", "reviews", "campaigns"],
  },
  {
    id: "4",
    slug: "hotel-luna",
    name: "Hotel Boutique Luna",
    tagline: "Lujo íntimo en la costa peruana",
    category: "hotel",
    location: "San Vicente de Cañete",
    plan: "enterprise",
    status: "active",
    rating: 4.8,
    reviewCount: 267,
    monthlyRevenue: 34500,
    reservationsThisMonth: 128,
    ordersThisMonth: 340,
    description:
      "Hotel boutique de lujo con 24 habitaciones premium, spa, restaurante gourmet y vistas panorámicas al Pacífico.",
    theme: THEMES["hotel-luna"],
    createdAt: "2023-11-20",
    owner: "Mariela Quispe",
    phone: "+51 984 321 098",
    email: "reservas@hotelluna.pe",
    features: ["reservations", "delivery", "catalog", "reviews", "loyalty", "campaigns"],
  },
];

// ─── Helper to get theme CSS vars as style object ─────────────────────────────

export function themeToVars(theme: TenantTheme): React.CSSProperties {
  return {
    "--tenant-primary": theme.primary,
    "--tenant-primary-light": theme.primaryLight,
    "--tenant-accent": theme.accent,
    "--tenant-bg": theme.background,
    "--tenant-surface": theme.surface,
    "--tenant-text": theme.text,
    "--tenant-text-muted": theme.textMuted,
    "--tenant-border": theme.border,
    "--tenant-gradient": theme.gradient,
    "--tenant-hero-gradient": theme.heroGradient,
  } as React.CSSProperties;
}

export function getTheme(slug: string): TenantTheme {
  return THEMES[slug] ?? THEMES.default;
}

export function getTenant(slug: string): Tenant | undefined {
  return TENANTS.find((t) => t.slug === slug);
}

export function buildTenantFromApi(apiTenant: TenantApiData): Tenant {
  const staticTenant = getTenant(apiTenant.slug);
  const baseTheme = staticTenant?.theme ?? getTheme(apiTenant.slug);

  // Si el tenant tiene un banner_url en la DB, usarlo como heroImage (override del theme estático)
  const theme: TenantTheme = apiTenant.bannerUrl
    ? { ...baseTheme, heroImage: apiTenant.bannerUrl }
    : baseTheme;

  return {
    id: apiTenant.id,
    slug: apiTenant.slug,
    name: apiTenant.name,
    tagline: apiTenant.tagline ?? staticTenant?.tagline ?? "",
    category: (apiTenant.category as Tenant["category"]) ?? staticTenant?.category ?? "other",
    location: apiTenant.location,
    plan: (apiTenant.plan as Tenant["plan"]) ?? staticTenant?.plan ?? "premium",
    status: (apiTenant.status as Tenant["status"]) ?? staticTenant?.status ?? "active",
    rating: apiTenant.rating,
    reviewCount: apiTenant.reviewCount,
    monthlyRevenue: apiTenant.monthlyRevenue,
    reservationsThisMonth: apiTenant.reservationsThisMonth,
    ordersThisMonth: apiTenant.ordersThisMonth,
    theme,
    createdAt: staticTenant?.createdAt ?? new Date().toISOString(),
    owner: staticTenant?.owner ?? "Pendiente",
    phone: apiTenant.phone ?? staticTenant?.phone,
    email: staticTenant?.email,
    features: (apiTenant.features as Tenant["features"]) ?? staticTenant?.features ?? ["catalog", "reviews"],
    description: apiTenant.description ?? staticTenant?.description ?? "",
    lat: apiTenant.lat,
    lng: apiTenant.lng,
    address: apiTenant.address,
    allowsDelivery: apiTenant.allowsDelivery,
    allowsPickup: apiTenant.allowsPickup,
    deliveryFee: apiTenant.deliveryFee,
    yapeEnabled: apiTenant.yapeEnabled,
    yapePhone: apiTenant.yapePhone,
    yapeHolder: apiTenant.yapeHolder,
    yapeQrUrl: apiTenant.yapeQrUrl,
    plinEnabled: apiTenant.plinEnabled,
    plinPhone: apiTenant.plinPhone,
    plinHolder: apiTenant.plinHolder,
    plinQrUrl: apiTenant.plinQrUrl,
    paymentInstructions: apiTenant.paymentInstructions,
    logoUrl: apiTenant.logoUrl,
  };
}
