import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";
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
    <AdminShell userName={user?.name ?? "Admin"}>
      {children}
    </AdminShell>
  );
}
