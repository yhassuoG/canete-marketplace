/**
 * Resuelve la URL base del backend Spring Boot de forma dinámica.
 *
 * - Si NEXT_PUBLIC_API_URL está definido, se usa tal cual.
 * - En el navegador: devuelve "" (string vacío) para que las URLs sean
 *   relativas (ej. "/api/v1/..."). Next.js las proxy al backend via
 *   rewrites en next.config.ts. Así funcionan desde cualquier dispositivo
 *   (localhost, LAN IP, celular) sin problemas de CORS ni localhost.
 * - En SSR (Node): usa localhost:8080 (el backend está en el mismo host).
 */
const CONFIGURED = process.env.NEXT_PUBLIC_API_URL;

export function getApiBase(): string {
  if (CONFIGURED) return CONFIGURED;

  if (typeof window !== "undefined") {
    // Cliente: URLs relativas — el proxy de Next.js las redirige al backend.
    return "";
  }

  // SSR: el backend está en localhost desde el punto de vista del server.
  return "http://localhost:8080";
}
