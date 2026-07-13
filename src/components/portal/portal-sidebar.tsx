"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalRole } from "@/lib/role-context";
import { portalIdentity } from "@/lib/portal-identity";
import { PORTAL_NAV, PORTAL_ADMIN_NAV, isNavActive, type PortalNavItem } from "@/lib/portal-nav";
import { Icon } from "@/components/shared/icons";
import { PersonBadge } from "@/components/shared/person-badge";
import { cn } from "@/lib/utils";

function NavLink({ item, active }: { item: PortalNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex w-full items-center gap-3 rounded-[11px] px-[13px] py-[11px] text-[14.5px] transition-colors",
        active
          ? "bg-gold-deep font-semibold text-navy-deep"
          : "font-medium text-sidebar-idle hover:bg-white/5",
      )}
    >
      <Icon name={item.icon} />
      {item.label}
    </Link>
  );
}

export function PortalSidebar() {
  const pathname = usePathname();
  const { role } = usePortalRole();
  const me = portalIdentity(role);
  const isAdmin = role === "admin";
  const mainNav = PORTAL_NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-navy-deep px-[14px] py-[18px] text-sidebar-fg max-lg:hidden">
      <Link href="/" className="flex items-center gap-[11px] px-2 pb-4 pt-[6px]">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-bronze font-serif text-[20px] font-semibold text-navy-deep">
          W
        </span>
        <span className="leading-[1.1]">
          <span className="block font-serif text-[16px] text-cream">Wesley</span>
          <span className="block text-[10.5px] uppercase tracking-[1.4px] text-sidebar-muted">
            {me.console}
          </span>
        </span>
      </Link>

      <nav className="vscroll mt-[6px] flex flex-1 flex-col gap-[3px] overflow-y-auto">
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
        ))}

        {isAdmin && (
          <>
            <div className="px-3 pb-[6px] pt-4 text-[10.5px] uppercase tracking-[1.6px] text-sidebar-faint">
              Administration
            </div>
            {PORTAL_ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isNavActive(pathname, item.href)} />
            ))}
          </>
        )}
      </nav>

      <div className="mt-2 border-t border-sidebar-border pt-3">
        <div className="flex items-center gap-[10px] px-2 py-[6px]">
          <PersonBadge initials={me.initials} color={me.color} className="size-[34px] rounded-full text-[13px]" />
          <div className="flex-1 leading-[1.15]">
            <div className="text-[13.5px] font-semibold text-cream">{me.name}</div>
            <div className="text-[11.5px] text-sidebar-muted">{me.roleLabel}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
