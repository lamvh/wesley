"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/shared/icons";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/our-rooms", label: "Our rooms" },
  { href: "/life-here", label: "Life here" },
  { href: "/our-home", label: "Our home" },
  { href: "/careers", label: "Careers" },
  { href: "/contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/90 bg-cream/[0.86] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-5 px-7 py-[15px] max-sm:px-4">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <span className="flex size-10 items-center justify-center rounded-[11px] bg-navy font-serif text-[22px] font-semibold text-gold">
            W
          </span>
          <span className="leading-[1.05]">
            <span className="block font-serif text-[19px] font-semibold text-ink">
              Wesley
            </span>
            <span className="block text-[11px] uppercase tracking-[2px] text-ink-meta">
              Home &amp; Care
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-[30px] text-[15px] font-medium max-lg:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-bronze-text",
                  active ? "font-bold text-navy" : "text-ink-nav",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 max-sm:gap-2">
          <Link
            href="/login?as=family"
            className="rounded-[10px] border border-line-strong px-[15px] py-[9px] text-[14px] font-semibold text-navy max-sm:hidden"
          >
            Family login
          </Link>
          <Link
            href="/login"
            className="rounded-[10px] bg-navy px-[17px] py-[10px] text-[14px] font-semibold text-cream max-sm:px-3"
          >
            Staff portal
          </Link>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="hidden size-[42px] items-center justify-center rounded-[10px] border border-line-strong bg-cream-2 text-navy max-lg:flex"
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-[2px] border-t border-line px-5 pb-4 pt-2 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="border-b border-line-divider px-[6px] py-3 text-[16px] font-semibold text-ink-soft last:border-b-0"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
