"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/lib/use-media-query";
import { usePortalRole } from "@/lib/role-context";
import { portalIdentity } from "@/lib/portal-identity";
import { PORTAL_NAV, PORTAL_ADMIN_NAV, isNavActive, type PortalNavItem } from "@/lib/portal-nav";
import { Icon } from "@/components/shared/icons";
import { PersonBadge } from "@/components/shared/person-badge";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: PortalNavItem;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "flex w-full items-center rounded-[11px] py-[11px] text-[14.5px] transition-colors",
        collapsed ? "justify-center px-0" : "gap-3 px-[13px]",
        active
          ? "bg-gold-deep font-semibold text-navy-deep"
          : "font-medium text-sidebar-idle hover:bg-white/5",
      )}
    >
      <Icon name={item.icon} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const { role } = usePortalRole();
  const [userCollapsed, setUserCollapsed] = useState(false);
  // Below 1024px the sidebar is forced to a slim icon rail (still visible).
  const forced = useMediaQuery("(max-width: 1023px)");
  const collapsed = forced || userCollapsed;
  const setCollapsed = setUserCollapsed;
  const me = portalIdentity(role);
  const isAdmin = role === "admin";
  const mainNav = PORTAL_NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        "sticky top-0 flex h-screen shrink-0 flex-col bg-navy-deep px-[14px] py-[18px] text-sidebar-fg transition-[width] max-[860px]:hidden",
        collapsed ? "w-[68px] px-[10px]" : "w-64",
      )}
    >
      <div className={cn("flex items-center gap-[11px] px-2 pb-4 pt-[6px]", collapsed && "justify-center px-0")}>
        <Link href="/" className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-bronze font-serif text-[20px] font-semibold text-navy-deep">
          W
        </Link>
        {!collapsed && (
          <Link href="/" className="flex-1 leading-[1.1]">
            <span className="block font-serif text-[16px] text-cream">Wesley</span>
            <span className="block whitespace-nowrap text-[10.5px] uppercase tracking-[1.4px] text-sidebar-muted">
              {me.console}
            </span>
          </Link>
        )}
        {!forced && !collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            title="Collapse menu"
            className="text-sidebar-muted hover:text-cream"
          >
            <Icon name="chevron-left" />
          </button>
        )}
      </div>
      {!forced && collapsed && (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expand menu"
          className="mb-1 flex justify-center text-sidebar-muted hover:text-cream"
        >
          <Icon name="chevron-right" />
        </button>
      )}

      <nav className="vscroll mt-[6px] flex flex-1 flex-col gap-[3px] overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} collapsed={collapsed} />
        ))}

        {isAdmin && (
          <>
            {!collapsed && (
              <div className="px-3 pb-[6px] pt-4 text-[10.5px] uppercase tracking-[1.6px] text-sidebar-faint">
                Administration
              </div>
            )}
            {PORTAL_ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} collapsed={collapsed} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-2 border-t border-sidebar-border pt-3">
        <div className={cn("flex items-center gap-[10px] px-2 py-[6px]", collapsed && "justify-center px-0")}>
          <PersonBadge initials={me.initials} color={me.color} className="size-[34px] rounded-full text-[13px]" />
          {!collapsed && (
            <div className="flex-1 leading-[1.15]">
              <div className="text-[13.5px] font-semibold text-cream">{me.name}</div>
              <div className="text-[11.5px] text-sidebar-muted">{me.roleLabel}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
