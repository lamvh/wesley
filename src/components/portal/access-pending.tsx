"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Shown when someone is signed in but has no active app_users assignment -
// "only assigned users are shown". Rendered by PortalLayout in place of the
// whole portal, so an unprovisioned account never sees any portal data.
export function AccessPending({
  email,
  suspended,
}: {
  email: string;
  suspended?: boolean;
}) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
      <div className="w-full max-w-[420px]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-[15px] bg-navy font-serif text-[30px] font-semibold text-gold">
          W
        </span>
        <h1 className="mt-5 font-serif text-[26px] font-medium text-ink">
          {suspended ? "Account suspended" : "Access not set up yet"}
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">
          {suspended ? (
            <>
              Your account (<span className="font-semibold text-ink-soft">{email}</span>)
              has been suspended. Contact your administrator to restore access.
            </>
          ) : (
            <>
              You&apos;re signed in as{" "}
              <span className="font-semibold text-ink-soft">{email}</span>, but this
              account hasn&apos;t been assigned a role yet. An administrator needs to
              provision your access before you can use the portal.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={signOut}
          className="mt-7 rounded-[11px] bg-navy px-6 py-[12px] text-[14.5px] font-semibold text-cream transition hover:bg-navy/90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
