import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AUTH_COOKIE, parseAuthCookie } from "@/lib/auth";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const raw = cookieStore.get(AUTH_COOKIE);
  const user = raw ? parseAuthCookie(raw.value) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar userName={user?.name ?? "Admin"} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
