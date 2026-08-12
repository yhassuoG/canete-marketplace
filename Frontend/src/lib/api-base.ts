/**
 * Resuelve la URL base del backend Spring Boot de forma dinámica.
 *
 * - En el navegador (cliente): usa NEXT_PUBLIC_API_URL si está definido
 *   (build-time), sino devuelve "" (string vacío) para que las URLs sean
 *   relativas (ej. "/api/v1/..."). Next.js las proxy al backend via
 *   rewrites en next.config.ts. Así funcionan desde cualquier dispositivo
 *   (localhost, LAN IP, celular) sin problemas de CORS ni localhost.
 * - En SSR (Node): usa API_BACKEND_URL si está definida (Docker: http://api:8080),
 *   sino localhost:8080 (el backend está en el mismo host en dev local).
 *   NUNCA usa NEXT_PUBLIC_API_URL en SSR porque eso causaría que el contenedor
 *   haga fetch a la URL pública (https://vallecanete.com) que requiere DNS
 *   público + SSL + hairpin NAT, lo cual falla o es muy lento dentro de Docker.
 */
const CONFIGURED = process.env.NEXT_PUBLIC_API_URL;
const SSR_BACKEND = process.env.API_BACKEND_URL ?? "http://localhost:8080";

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    // Cliente: usar NEXT_PUBLIC_API_URL si está definido, sino URLs relativas.
    return CONFIGURED || "";
  }

  // SSR: usar API_BACKEND_URL (Docker interno) o localhost:8080 (dev local).
  return SSR_BACKEND;
}
