"use client";

import dynamic from "next/dynamic";

const StorefrontLeafletMap = dynamic(
  () => import("@/components/tenant/storefront-leaflet-map"),
  { ssr: false, loading: () => <div className="h-full animate-pulse rounded-3xl bg-slate-100" /> }
);

interface Props {
  lat: number;
  lng: number;
  primaryColor?: string;
}

export function RestaurantLocationMap({ lat, lng, primaryColor }: Readonly<Props>) {
  return <StorefrontLeafletMap lat={lat} lng={lng} primaryColor={primaryColor} />;
}
