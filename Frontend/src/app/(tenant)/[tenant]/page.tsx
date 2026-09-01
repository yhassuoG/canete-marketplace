import { notFound } from "next/navigation";
import { buildTenantFromApi } from "@/lib/themes";
import { TenantStorefront } from "@/components/tenant/tenant-storefront";
import { fetchTenant } from "@/lib/api";

interface Props {
  params: Promise<{ tenant: string }>;
}

export default async function TenantPage({ params }: Props) {
  const { tenant: slug } = await params;
  const apiData = await fetchTenant(slug);

  if (!apiData) {
    notFound();
  }

  const tenant = buildTenantFromApi(apiData);

  return <TenantStorefront tenant={tenant} />;
}
