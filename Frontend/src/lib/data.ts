export type Category = {
  title: string;
  description: string;
  metric: string;
  emoji: string;
  gradient: string;
};

export type AdTier = "premium" | "destacado" | "basico";

export type Business = {
  name: string;
  category: string;
  location: string;
  score: number;
  reviews: number;
  tenantSlug: string;
  accent: string;
  adTier: AdTier;
  tagline: string;
  priceFrom: number;
  image: string;
  imageUrl?: string;
  badge?: string;
};

export const categories: Category[] = [
  {
    title: "Restaurantes",
    description: "Cocina marina, criolla y autor con reserva y delivery.",
    metric: "+48 marcas",
    emoji: "🍽️",
    gradient: "from-orange-400 to-rose-500",
  },
  {
    title: "Hoteles",
    description: "Hospedajes boutique, familiares y corporativos.",
    metric: "+26 espacios",
    emoji: "🏨",
    gradient: "from-sky-400 to-indigo-600",
  },
  {
    title: "Tours",
    description: "Rutas culturales, aventura, enoturismo y playa.",
    metric: "+71 experiencias",
    emoji: "🧭",
    gradient: "from-emerald-400 to-teal-600",
  },
  {
    title: "Eventos",
    description: "Agenda local con reservas, tickets y promociones.",
    metric: "365 días al año",
    emoji: "🎉",
    gradient: "from-fuchsia-500 to-purple-600",
  },
  {
    title: "Delivery",
    description: "Última milla integrada con reservas y catálogo.",
    metric: "+30 repartidores",
    emoji: "🛵",
    gradient: "from-amber-400 to-orange-600",
  },
  {
    title: "Vinos & Enoturismo",
    description: "Valle de Lunahuana, catas y experiencias de autor.",
    metric: "+15 viñedos",
    emoji: "🍷",
    gradient: "from-rose-400 to-pink-600",
  },
  {
    title: "Playa & Costa",
    description: "Balnearios, surf y experiencias costeras en Cañete.",
    metric: "+20 spots",
    emoji: "🏖️",
    gradient: "from-cyan-400 to-blue-600",
  },
  {
    title: "Mercado & Retail",
    description: "Productos locales, artesanía y marcas regionales.",
    metric: "+60 tiendas",
    emoji: "🛍️",
    gradient: "from-lime-400 to-green-600",
  },
];

export const featuredBusinesses: Business[] = [
  {
    name: "Muelle Pacífico",
    category: "Seafood House",
    location: "San Vicente de Cañete",
    score: 4.9,
    reviews: 1284,
    tenantSlug: "muelle-pacifico",
    accent: "from-orange-50 to-amber-50",
    adTier: "premium",
    tagline: "Cocina marina de autor frente al mar",
    priceFrom: 85,
    image: "seafood",
    imageUrl: "https://picsum.photos/seed/seafood-muelle/800/600",
    badge: "PATROCINADO",
  },
  {
    name: "Paraíso Lunahuana",
    category: "Adventure Lodge",
    location: "Lunahuana",
    score: 4.8,
    reviews: 962,
    tenantSlug: "paraiso-lunahuana",
    accent: "from-emerald-50 to-teal-50",
    adTier: "premium",
    tagline: "Aventura, rafting y vistas al valle",
    priceFrom: 120,
    image: "adventure",
    imageUrl: "https://picsum.photos/seed/adventure-lunahuana/800/600",
    badge: "PATROCINADO",
  },
  {
    name: "Viña del Sol",
    category: "Winery Experience",
    location: "Nuevo Imperial",
    score: 4.7,
    reviews: 743,
    tenantSlug: "vina-del-sol",
    accent: "from-rose-50 to-pink-50",
    adTier: "destacado",
    tagline: "Enoturismo, catas y gastronomía de valle",
    priceFrom: 65,
    image: "winery",
    imageUrl: "https://picsum.photos/seed/winery-vina/800/600",
    badge: "DESTACADO",
  },
  {
    name: "Hotel Costa Verde",
    category: "Boutique Hotel",
    location: "Cerro Azul",
    score: 4.6,
    reviews: 521,
    tenantSlug: "costa-verde",
    accent: "from-sky-50 to-indigo-50",
    adTier: "destacado",
    tagline: "Frente al mar con piscina y spa",
    priceFrom: 150,
    image: "hotel",
    imageUrl: "https://picsum.photos/seed/hotel-costa-verde/800/600",
    badge: "DESTACADO",
  },
  {
    name: "Café Puerto",
    category: "Café & Brunch",
    location: "San Vicente de Cañete",
    score: 4.5,
    reviews: 389,
    tenantSlug: "cafe-puerto",
    accent: "from-amber-50 to-orange-50",
    adTier: "basico",
    tagline: "Café de especialidad y brunch costero",
    priceFrom: 25,
    image: "cafe",
    imageUrl: "https://picsum.photos/seed/cafe-puerto/800/600",
  },
  {
    name: "Surf Cañete",
    category: "Surf School",
    location: "Puerto Cañete",
    score: 4.4,
    reviews: 256,
    tenantSlug: "surf-canete",
    accent: "from-cyan-50 to-blue-50",
    adTier: "basico",
    tagline: "Clases y equipos para todos los niveles",
    priceFrom: 40,
    image: "surf",
    imageUrl: "https://picsum.photos/seed/surf-canete/800/600",
  },
];

export const heroSlides: Business[] = featuredBusinesses.filter((b) => b.adTier === "premium");

export const adPlans = [
  {
    tier: "Básico",
    price: 0,
    period: "gratis",
    features: [
      "Perfil de negocio",
      "Catálogo hasta 20 productos",
      "Reservas online",
      "Aparición en búsquedas",
    ],
    highlighted: false,
    cta: "Empezar gratis",
  },
  {
    tier: "Destacado",
    price: 99,
    period: "/mes",
    features: [
      "Todo lo de Básico",
      "Badge DESTACADO en listings",
      "Aparición en sección destacada",
      "Estadísticas avanzadas",
      "Catálogo ilimitado",
      "Soporte prioritario",
    ],
    highlighted: true,
    cta: "Probar 7 días gratis",
  },
  {
    tier: "Premium",
    price: 249,
    period: "/mes",
    features: [
      "Todo lo de Destacado",
      "Carrusel hero en home",
      "Badge PATROCINADO",
      "Posicionamiento top en búsquedas",
      "Página personalizada",
      "Analytics con conversión",
      "Account manager dedicado",
    ],
    highlighted: false,
    cta: "Contactar ventas",
  },
];

export const demandSeries = [
  { name: "Lun", bookings: 22, delivery: 16 },
  { name: "Mar", bookings: 28, delivery: 19 },
  { name: "Mie", bookings: 31, delivery: 26 },
  { name: "Jue", bookings: 37, delivery: 29 },
  { name: "Vie", bookings: 46, delivery: 38 },
  { name: "Sab", bookings: 61, delivery: 48 },
  { name: "Dom", bookings: 58, delivery: 42 },
];
