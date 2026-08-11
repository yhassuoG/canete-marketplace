import { type NextRequest, NextResponse } from "next/server";

const SYSTEM_PREFIXES = ["/_next", "/api", "/static", "/favicon", "/manifest", "/.well-known"];
const AUTH_COOKIE = "canete_auth";

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl;

  // Skip system and static paths
  if (SYSTEM_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
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
