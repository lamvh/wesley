"use client";

import { usePortalRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import type { PortalRole } from "@/types/domain";

const OPTIONS: { value: PortalRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

export function RoleToggle() {
  const { role, setRole } = usePortalRole();
  return (
    <div className="flex items-center rounded-full border border-line-soft bg-toggle-track p-[3px]">
      {OPTIONS.map((opt) => {
        const on = role === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setRole(opt.value)}
            className={cn(
              "rounded-full px-4 py-[7px] text-[13.5px] font-semibold transition-colors",
              on ? "bg-cream-2 text-ink shadow-sm" : "text-ink-meta",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
