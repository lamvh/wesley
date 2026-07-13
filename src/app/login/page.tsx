import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginView } from "@/components/auth/login-view";

export const metadata: Metadata = {
  title: "Sign in — Wesley Home & Care",
};

// Standalone auth route (no marketing/portal chrome). Suspense boundary is
// required because LoginView reads useSearchParams().
export default function LoginPage() {
  return (
    <Suspense>
      <LoginView />
    </Suspense>
  );
}
