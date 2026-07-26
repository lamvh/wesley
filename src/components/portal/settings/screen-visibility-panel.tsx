"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/shared/icons";
import { PermissionSwitch } from "@/components/portal/users/permission-switch";
import { setScreenHidden } from "@/lib/actions/screen-visibility";
import { hideableScreens } from "@/lib/portal-nav";
import { cn } from "@/lib/utils";

// One switch per portal screen. Off takes the screen out of both navs AND
// closes its route (middleware), so this is a real off, not a tidy-up.
// super_admin only - the page above redirects anyone else, and the action
// refuses them again server-side.
//
// The switch flips optimistically and rolls back if the server rejects it -
// same idiom as the permission grid, which this borrows its switch from.

export function ScreenVisibilityPanel({ hiddenScreens }: { hiddenScreens: string[] }) {
  const screens = hideableScreens();
  const [hidden, setHidden] = useState<string[]>(hiddenScreens);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle(href: string) {
    const nextHidden = !hidden.includes(href);
    const rollback = hidden;
    setError(null);
    setHidden((h) => (nextHidden ? [...h, href] : h.filter((x) => x !== href)));

    startTransition(async () => {
      const res = await setScreenHidden(href, nextHidden);
      if (res?.error) {
        setHidden(rollback);
        setError(res.error);
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="border-b border-line-divider px-[22px] py-[15px]">
        <h3 className="font-serif text-[19px] font-semibold text-ink">Screens</h3>
        <p className="mt-[3px] text-[12.5px] text-ink-faint">
          Switching a screen off hides it from every user, including admins, and closes its
          address. Switch it back on to restore it - nothing is deleted.
        </p>
      </div>

      {error && (
        <p role="alert" className="border-b border-line-divider bg-high-tint px-[22px] py-[10px] text-[13px] font-medium text-high">
          {error}
        </p>
      )}

      {screens.map((s) => {
        const on = !hidden.includes(s.href);
        return (
          <div
            key={s.href}
            className="flex items-center gap-3 border-b border-line-divider px-[22px] py-[13px] last:border-b-0"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-[9px]",
                on ? "bg-navy-tint text-navy" : "bg-line-soft text-ink-faint",
              )}
            >
              <Icon name={s.icon} size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <div className={cn("text-[13.5px] font-semibold", on ? "text-ink" : "text-ink-faint")}>
                {s.label}
              </div>
              <div className="mt-[1px] text-[11.5px] text-ink-faint">{s.href}</div>
            </div>
            <span className={cn("text-[12px] font-semibold", on ? "text-sage" : "text-ink-faint")}>
              {on ? "Visible" : "Hidden"}
            </span>
            <PermissionSwitch on={on} onToggle={() => toggle(s.href)} />
          </div>
        );
      })}
    </section>
  );
}
