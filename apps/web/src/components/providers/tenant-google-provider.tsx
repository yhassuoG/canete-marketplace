"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function TenantGoogleProvider({ children }: { children: React.ReactNode }) {
  if (!CLIENT_ID) {
    // Google OAuth not configured — render children without provider
    return <>{children}</>;
  }
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
