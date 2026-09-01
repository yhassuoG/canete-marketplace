import { notFound } from "next/navigation";
import { fetchTenant } from "@/lib/api";
import { buildTenantFromApi, getTheme, themeToVars } from "@/lib/themes";
import { BottomNav } from "@/components/ui/bottom-nav";
import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ tenant: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant: slug } = await params;
  const apiTenant = await fetchTenant(slug);

  if (!apiTenant) return { title: "Negocio no encontrado" };

  const resolvedTenant = buildTenantFromApi(apiTenant);
  return {
    title: `${resolvedTenant.name} · vallecanete`,
    description: resolvedTenant.description,
  };
}

export default async function TenantLayout({ children, params }: Props) {
  const { tenant: slug } = await params;
  const apiTenant = await fetchTenant(slug);

  // Unknown slugs that aren't system routes return 404
  const SYSTEM_SLUGS = new Set(["admin", "dashboard", "marketplace", "api", "favicon.ico"]);
  if (!apiTenant && !SYSTEM_SLUGS.has(slug)) {
    notFound();
  }

  const vars = themeToVars(getTheme(slug));

  return (
    <TenantGoogleProvider>
      <div style={vars} className="min-h-screen pb-20 md:pb-0">
        {children}
        <BottomNav />
      </div>
    </TenantGoogleProvider>
  );
}
