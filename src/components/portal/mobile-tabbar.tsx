"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalRole } from "@/lib/role-context";
import { portalIdentity } from "@/lib/portal-identity";
import {
  PORTAL_NAV,
  PORTAL_ADMIN_NAV,
  isNavActive,
  type PortalNavItem,
} from "@/lib/portal-nav";
import { Icon } from "@/components/shared/icons";
import { PersonBadge } from "@/components/shared/person-badge";
import { cn } from "@/lib/utils";

// Bottom tab bar shown ≤860px in place of the hidden sidebar (design: the
// collapsed sidebar is real). Four primary destinations + a "More" sheet that
// holds the full nav, the admin group and identity.
const TAB_HREFS = ["/portal", "/portal/residents", "/portal/roster", "/portal/meals"];

export function MobileTabBar() {
  const pathname = usePathname();
  const { role } = usePortalRole();
  const [moreOpen, setMoreOpen] = useState(false);
  const me = portalIdentity(role);
  const isAdmin = role === "admin";

  const tabs = TAB_HREFS.map((href) =>
    PORTAL_NAV.find((i) => i.href === href),
  ).filter((i): i is PortalNavItem => Boolean(i));
  const mainNav = PORTAL_NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 hidden items-stretch border-t border-sidebar-border bg-navy-deep px-1 pb-[env(safe-area-inset-bottom)] text-sidebar-idle max-[860px]:flex">
        {tabs.map((item) => {
          const active = isNavActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-medium",
                active ? "text-gold-deep" : "text-sidebar-idle",
              )}
            >
              <Icon name={item.icon} size={21} />
              <span className="truncate">{shortLabel(item.label)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] font-medium text-sidebar-idle"
        >
          <Icon name="menu" size={21} />
          <span>More</span>
        </button>
      </nav>

      {moreOpen && (
        <div
          className="fixed inset-0 z-40 hidden max-[860px]:block"
          role="dialog"
          aria-modal="true"
          aria-label="Portal menu"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[22px] bg-navy-deep px-4 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-3 text-sidebar-fg">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-sidebar-border" />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <PersonBadge
                  initials={me.initials}
                  color={me.color}
                  className="size-[34px] rounded-full text-[13px]"
                />
                <div className="leading-[1.15]">
                  <div className="text-[13.5px] font-semibold text-cream">{me.name}</div>
                  <div className="text-[11.5px] text-sidebar-muted">{me.roleLabel}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="text-sidebar-muted hover:text-cream"
              >
                <Icon name="close" size={22} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-[3px]">
              {mainNav.map((item) => (
                <SheetLink
                  key={item.href}
                  item={item}
                  active={isNavActive(pathname, item.href)}
                  onClick={() => setMoreOpen(false)}
                />
              ))}
            </div>

            {isAdmin && (
              <>
                <div className="px-3 pb-[6px] pt-4 text-[10.5px] uppercase tracking-[1.6px] text-sidebar-faint">
                  Administration
                </div>
                <div className="grid grid-cols-1 gap-[3px]">
                  {PORTAL_ADMIN_NAV.map((item) => (
                    <SheetLink
                      key={item.href}
                      item={item}
                      active={isNavActive(pathname, item.href)}
                      onClick={() => setMoreOpen(false)}
                    />
                  ))}
                </div>
              </>
            )}

            <Link
              href="/"
              onClick={() => setMoreOpen(false)}
              className="mt-4 flex items-center justify-center rounded-[11px] border border-sidebar-border py-3 text-[14px] font-semibold text-sidebar-fg"
            >
              View website
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function SheetLink({
  item,
  active,
  onClick,
}: {
  item: PortalNavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-[11px] px-[13px] py-3 text-[15px]",
        active
          ? "bg-gold-deep font-semibold text-navy-deep"
          : "font-medium text-sidebar-idle hover:bg-white/5",
      )}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

// Compact the compound nav labels ("Roster & shifts" → "Roster") for the tab bar.
function shortLabel(label: string): string {
  return label.split(" ")[0].replace("&", "").trim();
}
