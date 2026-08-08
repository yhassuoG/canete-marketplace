import { notFound } from "next/navigation";
import { buildTenantFromApi, getTenant } from "@/lib/themes";
import { TenantStorefront } from "@/components/tenant/tenant-storefront";
import { fetchTenant } from "@/lib/api";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantPage({ params }: Props) {
  const { tenant: slug } = await params;
  const staticTenant = getTenant(slug);
  const apiData = await fetchTenant(slug);

  if (!staticTenant && !apiData) {
    notFound();
  }

  const tenant = apiData ? buildTenantFromApi(apiData) : staticTenant;

  if (!tenant) {
    notFound();
  }

  return <TenantStorefront tenant={tenant} />;
}
