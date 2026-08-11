/**
 * Resuelve la URL base del backend Spring Boot de forma dinámica.
 *
 * - Si NEXT_PUBLIC_API_URL está definido, se usa tal cual (build-time, cliente).
 * - En el navegador: devuelve "" (string vacío) para que las URLs sean
 *   relativas (ej. "/api/v1/..."). Next.js las proxy al backend via
 *   rewrites en next.config.ts. Así funcionan desde cualquier dispositivo
 *   (localhost, LAN IP, celular) sin problemas de CORS ni localhost.
 * - En SSR (Node): usa API_BACKEND_URL si está definida (Docker: http://api:8080),
 *   sino localhost:8080 (el backend está en el mismo host en dev local).
 */
const CONFIGURED = process.env.NEXT_PUBLIC_API_URL;
const SSR_BACKEND = process.env.API_BACKEND_URL ?? "http://localhost:8080";

export function getApiBase(): string {
  if (CONFIGURED) return CONFIGURED;

  if (typeof window !== "undefined") {
    // Cliente: URLs relativas — el proxy de Next.js las redirige al backend.
    return "";
  }

  // SSR: usar API_BACKEND_URL (Docker) o localhost:8080 (dev local).
  return SSR_BACKEND;
}
