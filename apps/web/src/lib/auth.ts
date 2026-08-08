export type AuthUser = {
  email: string;
  name: string;
  role: "admin" | "business";
  tenantSlug?: string;
  tenantName?: string;
  primaryColor?: string;
  gradient?: string;
};

export const AUTH_COOKIE = "canete_auth";

/** Set auth cookie from client side */
export function setAuthCookie(user: AuthUser) {
  const value = encodeURIComponent(JSON.stringify(user));
  document.cookie = `${AUTH_COOKIE}=${value}; path=/; max-age=86400; SameSite=Lax`;
}

/** Clear auth cookie from client side */
export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/** Read auth cookie from client side */
export function getAuthUser(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${AUTH_COOKIE}=([^;]*)`)
  );
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as AuthUser;
  } catch {
    return null;
  }
}

/** Parse auth cookie value (usable server-side) */
export function parseAuthCookie(value: string): AuthUser | null {
  try {
    return JSON.parse(decodeURIComponent(value)) as AuthUser;
  } catch {
    return null;
  }
}
