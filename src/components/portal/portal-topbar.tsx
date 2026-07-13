"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/shared/icons";
import { RoleToggle } from "@/components/portal/role-toggle";
import { BuildingSwitch } from "@/components/portal/building-switch";
import { usePortalRole } from "@/lib/role-context";
import { createClient } from "@/lib/supabase/client";

export function PortalTopbar() {
  const { role } = usePortalRole();
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-5 border-b border-line bg-cream/90 px-[30px] py-[13px] backdrop-blur-sm max-md:flex-wrap max-md:gap-y-[10px]">
      {role === "admin" && <BuildingSwitch />}
      <div className="tb-search flex w-full max-w-[360px] flex-1 items-center gap-[10px] rounded-[11px] border border-line bg-cream-2 px-[14px] py-[8px] transition-colors focus-within:border-navy focus-within:bg-cream-3 max-sm:hidden">
        <Icon name="search" size={18} className="shrink-0 text-search-placeholder" />
        <input
          type="search"
          aria-label="Search residents, staff, stock"
          placeholder="Search residents, staff, stock…"
          className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-search-placeholder [&::-webkit-search-cancel-button]:appearance-none"
        />
        <kbd className="hidden shrink-0 rounded-[6px] border border-line-soft bg-cream px-[6px] py-[2px] text-[11px] font-semibold text-ink-faint lg:inline-block">
          ⌘K
        </kbd>
      </div>
      <div className="flex-1" />
      <RoleToggle />
      <div className="text-right leading-[1.15] max-md:hidden">
        <div className="text-[13.5px] font-semibold text-ink-soft">
          Saturday, 11 July
        </div>
        <div className="text-[12px] text-ink-faint">Kōwhai · Rātā · Tōtara</div>
      </div>
      <Link
        href="/"
        className="rounded-[10px] border border-line-strong px-[14px] py-[9px] text-[13.5px] font-semibold text-navy max-[860px]:hidden"
      >
        View website
      </Link>
      <button
        type="button"
        onClick={signOut}
        aria-label="Sign out"
        className="flex items-center gap-[6px] rounded-[10px] border border-line-strong px-[12px] py-[9px] text-[13.5px] font-semibold text-navy hover:bg-cream-2"
      >
        <Icon name="logout" size={17} />
        <span className="max-[860px]:hidden">Sign out</span>
      </button>
    </header>
  );
}
