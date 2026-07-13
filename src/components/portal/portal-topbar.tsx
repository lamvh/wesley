"use client";

import Link from "next/link";
import { Icon } from "@/components/shared/icons";
import { RoleToggle } from "@/components/portal/role-toggle";
import { BuildingSwitch } from "@/components/portal/building-switch";
import { usePortalRole } from "@/lib/role-context";

export function PortalTopbar() {
  const { role } = usePortalRole();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-5 border-b border-line bg-cream/90 px-[30px] py-[13px] backdrop-blur-sm max-md:flex-wrap max-md:gap-y-[10px]">
      {role === "admin" && <BuildingSwitch />}
      <div className="tb-search flex max-w-[340px] flex-1 items-center gap-[10px] rounded-[11px] border border-line bg-cream-2 px-[14px] py-[9px] text-search-placeholder max-sm:hidden">
        <Icon name="search" />
        <span className="text-[14px]">Search residents, staff, stock…</span>
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
        className="rounded-[10px] border border-line-strong px-[14px] py-[9px] text-[13.5px] font-semibold text-navy"
      >
        View website
      </Link>
    </header>
  );
}
