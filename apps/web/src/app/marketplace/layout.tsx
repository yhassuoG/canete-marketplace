import { TenantGoogleProvider } from "@/components/providers/tenant-google-provider";

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <TenantGoogleProvider>{children}</TenantGoogleProvider>;
}
