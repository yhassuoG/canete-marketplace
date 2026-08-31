import { cookies } from "next/headers";
import { BusinessShell } from "@/components/dashboard/business-shell";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE);
  const user = raw ? parseAuthCookie(raw.value) : null;

  return (
    <BusinessShell
      tenantName={user?.tenantName ?? "Mi Negocio"}
      tenantSlug={user?.tenantSlug ?? "dashboard"}
      primaryColor={user?.primaryColor ?? "#083d77"}
      gradient={user?.gradient ?? "linear-gradient(135deg, #083d77 0%, #1a5ba8 100%)"}
      userName={user?.name ?? "Usuario"}
    >
      {children}
    </BusinessShell>
  );
}
