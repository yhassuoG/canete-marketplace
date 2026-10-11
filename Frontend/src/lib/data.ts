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
