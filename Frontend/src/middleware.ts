import { type NextRequest, NextResponse } from "next/server";

const SYSTEM_PREFIXES = ["/_next", "/api", "/static", "/favicon", "/manifest", "/.well-known"]; // eslint-disable-line
const AUTH_COOKIE = "canete_auth";
const API_BACKEND = process.env.API_BACKEND_URL ?? "http://localhost:8080";

// Rutas que siempre se permiten incluso en modo mantenimiento
const MAINTENANCE_ALLOWED_PREFIXES = ["/admin", "/login", "/maintenance", "/api"];

/**
 * Consulta el estado del modo mantenimiento al backend.
 * Usa cache en memoria con TTL corto para no saturar el backend en cada request.
 */
let maintenanceCache: { value: boolean; expires: number } | null = null;
const MAINTENANCE_CACHE_TTL_MS = 5_000; // 5 segundos

async function isMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && maintenanceCache.expires > now) {
    return maintenanceCache.value;
  }
  try {
    const res = await fetch(`${API_BACKEND}/api/settings/maintenance`, { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    const value = Boolean(data.enabled);
    maintenanceCache = { value, expires: now + MAINTENANCE_CACHE_TTL_MS };
    return value;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Skip system and static paths
  if (SYSTEM_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ── Modo mantenimiento ────────────────────────────────────────────────────
  // Si el modo mantenimiento está activado, redirigir todas las rutas públicas
  // a /maintenance. Se permite acceso a /admin, /login, /maintenance y /api.
  const isAllowedDuringMaintenance = MAINTENANCE_ALLOWED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  );
  if (!isAllowedDuringMaintenance) {
    if (await isMaintenanceMode()) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // Skip login page itself
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Auth guard for /admin and /dashboard
  if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    const authCookie = request.cookies.get(AUTH_COOKIE);
    if (!authCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    try {
      const user = JSON.parse(decodeURIComponent(authCookie.value)) as { role: string };
      // Business users cannot access /admin
      if (pathname.startsWith("/admin") && user.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
      // Admin users trying /dashboard → send to /admin
      if (pathname.startsWith("/dashboard") && user.role === "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin";
        return NextResponse.redirect(url);
      }
    } catch {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Subdomain-based tenant routing: muelle-pacifico.canete.app → /muelle-pacifico
  const subdomainMatch = hostname.match(
    /^([a-z0-9-]+)\.(localhost|canete\.app|canete\.pe)$/
  );
  if (
    subdomainMatch &&
    !["www", "admin", "app", "api"].includes(subdomainMatch[1])
  ) {
    const tenant = subdomainMatch[1];
    const url = request.nextUrl.clone();
    if (pathname === "/") {
      url.pathname = `/${tenant}`;
    } else {
      url.pathname = `/${tenant}${pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
