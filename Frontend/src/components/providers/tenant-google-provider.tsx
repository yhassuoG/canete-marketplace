"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

// Use the configured client ID, or a dummy placeholder so the provider
// context is always present (required by useGoogleLogin hook at build time).
const CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "dummy-client-id.apps.googleusercontent.com";

export function TenantGoogleProvider({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}
