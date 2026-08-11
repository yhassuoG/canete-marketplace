"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Render children only after the component has mounted on the client.
 * This prevents hydration mismatches for components (like recharts)
 * that produce different DOM on the server vs client.
 *
 * Usage:
 *   <ClientOnly>
 *     <PieChart>...</PieChart>
 *   </ClientOnly>
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{fallback}</>;

  return <>{children}</>;
}
