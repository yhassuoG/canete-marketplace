import { cookies } from "next/headers";
import { BusinessSidebar } from "@/components/dashboard/business-sidebar";
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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <BusinessSidebar
        tenantName={user?.tenantName ?? "Mi Negocio"}
        tenantSlug={user?.tenantSlug ?? "dashboard"}
        primaryColor={user?.primaryColor ?? "#083d77"}
        gradient={user?.gradient ?? "linear-gradient(135deg, #083d77 0%, #1a5ba8 100%)"}
        userName={user?.name ?? "Usuario"}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
