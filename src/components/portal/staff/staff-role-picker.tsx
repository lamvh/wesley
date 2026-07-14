import { cn } from "@/lib/utils";

// Select-only MULTI role picker for the staff form: click a chip to toggle it in
// or out of this staffer's roles (several can be on at once). Roles themselves
// are created/deleted in Staff → Roles & groups, not here.
export function StaffRolePicker({
  roles,
  selectedRoles,
  onToggle,
}: {
  roles: string[];
  selectedRoles: string[];
  onToggle: (role: string) => void;
}) {
  return (
    <div>
      <span className="mb-[9px] block text-[12.5px] font-bold text-ink-soft">
        Role <span className="font-normal text-ink-faint">(choose one or more)</span>
      </span>
      <div className="grid grid-cols-2 gap-[9px]">
        {roles.map((r) => {
          const on = selectedRoles.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => onToggle(r)}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center gap-2 rounded-[11px] border-[1.5px] px-3 py-[10px] text-left text-[13px] font-semibold transition-colors",
                on ? "border-navy bg-navy-tint text-navy" : "border-line-soft bg-cream-2 text-ink-soft",
              )}
            >
              <span
                className={cn(
                  "flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border text-[11px] leading-none",
                  on ? "border-navy bg-navy text-cream" : "border-line-strong bg-cream",
                )}
              >
                {on ? "✓" : ""}
              </span>
              {r}
            </button>
          );
        })}
      </div>
      <p className="mt-[9px] text-[11.5px] text-ink-faint">
        Roles are managed in the <span className="font-semibold text-ink-soft">Roles &amp; groups</span> tab.
      </p>
    </div>
  );
}
