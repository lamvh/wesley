"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/shared/icons";
import { signIn } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

type Audience = "staff" | "family";

// Mobile-first login backed by Supabase Auth. A successful sign-in redirects
// to the page the user was headed for (?next=), else the portal (staff) or
// family portal. Audience preselect via ?as=family.
export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const [audience, setAudience] = useState<Audience>(
    params.get("as") === "family" ? "family" : "staff",
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || pending) return;
    setError(null);

    const fd = new FormData();
    fd.set("identifier", identifier);
    fd.set("password", password);

    startTransition(async () => {
      const res = await signIn({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      const next = params.get("next");
      const dest =
        next && next.startsWith("/portal")
          ? next
          : audience === "family"
            ? "/portal/family"
            : "/portal";
      router.replace(dest);
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream px-5 py-10">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
        {/* Brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex size-14 items-center justify-center rounded-[15px] bg-navy font-serif text-[30px] font-semibold text-gold">
            W
          </span>
          <h1 className="mt-4 font-serif text-[30px] font-medium leading-[1.05] text-ink">
            Welcome back
          </h1>
          <p className="mt-2 text-[14.5px] text-ink-muted">
            Sign in to Wesley Home &amp; Care
          </p>
        </div>

        {/* Audience toggle */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-[13px] border border-line-soft bg-toggle-track p-1">
          {(["staff", "family"] as Audience[]).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAudience(a)}
              className={cn(
                "rounded-[10px] py-[9px] text-[14px] font-semibold capitalize transition",
                audience === a ? "bg-cream-2 text-navy shadow-sm" : "text-ink-muted",
              )}
            >
              {a === "staff" ? "Staff" : "Family"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-semibold text-ink-soft">Username hoặc email</span>
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username hoặc you@wesleymteden.nz"
              className="rounded-[11px] border border-input bg-cream-2 px-[14px] py-[12px] text-[15px] text-ink outline-none focus:border-navy"
            />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className="text-[13px] font-semibold text-ink-soft">Password</span>
            <div className="flex items-center rounded-[11px] border border-input bg-cream-2 pr-2 focus-within:border-navy">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="min-w-0 flex-1 bg-transparent px-[14px] py-[12px] text-[15px] text-ink outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="px-2 text-ink-faint hover:text-navy"
              >
                <Icon name={showPw ? "close" : "lock"} size={18} />
              </button>
            </div>
          </label>

          <div className="-mt-1 flex justify-end">
            <button type="button" className="text-[13px] font-semibold text-bronze-text">
              Forgot password?
            </button>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit || pending}
            className={cn(
              "mt-1 rounded-[11px] bg-navy py-[13px] text-[15px] font-semibold text-cream transition",
              canSubmit && !pending
                ? "hover:bg-navy/90"
                : "cursor-not-allowed opacity-50",
            )}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-[13.5px] text-ink-muted">
          {audience === "family" ? (
            <>
              Need access?{" "}
              <Link href="/contact" className="font-semibold text-bronze-text">
                Contact the home
              </Link>
            </>
          ) : (
            <>
              Trouble signing in?{" "}
              <Link href="/contact" className="font-semibold text-bronze-text">
                Ask your manager
              </Link>
            </>
          )}
        </p>
      </div>

      <Link
        href="/"
        className="mx-auto mt-8 text-[13.5px] font-medium text-ink-faint hover:text-navy"
      >
        ← Back to website
      </Link>
    </div>
  );
}
