import { cn } from "@/lib/utils";

// Editable, MULTI-select role picker for the staff form: click a chip to toggle
// it in/out of this staffer's roles (several can be on at once). Add a new role
// option via the input + button; remove an option via its × — but only when the
// option is neither the last one nor assigned to any staff member (usedRoles).
export function StaffRolePicker({
  roles,
  selectedRoles,
  usedRoles,
  newRole,
  onToggle,
  onRemove,
  onNewRoleChange,
  onAdd,
}: {
  roles: string[];
  selectedRoles: string[];
  usedRoles: string[];
  newRole: string;
  onToggle: (role: string) => void;
  onRemove: (role: string) => void;
  onNewRoleChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <span className="mb-[9px] block text-[12.5px] font-bold text-ink-soft">
        Role <span className="font-normal text-ink-faint">(choose one or more)</span>
      </span>
      <div className="grid grid-cols-2 gap-[9px]">
        {roles.map((r) => {
          const on = selectedRoles.includes(r);
          const removable = roles.length > 1 && !usedRoles.includes(r);
          return (
            <div key={r} className="relative flex">
              <button
                type="button"
                onClick={() => onToggle(r)}
                aria-pressed={on}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[11px] border-[1.5px] py-[10px] text-left text-[13px] font-semibold transition-colors",
                  removable ? "pl-3 pr-8" : "px-3",
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
              {removable && (
                <button
                  type="button"
                  onClick={() => onRemove(r)}
                  title="Delete role"
                  aria-label={`Delete role ${r}`}
                  className="absolute right-[7px] top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-rust-tint text-[14px] leading-none text-rust"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-[10px] flex gap-2">
        <input
          value={newRole}
          onChange={(e) => onNewRoleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder="New role name"
          className="flex-1 rounded-[10px] border border-line-soft bg-cream-2 px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-navy"
        />
        <button
          type="button"
          onClick={onAdd}
          className="whitespace-nowrap rounded-[10px] bg-navy-tint px-[15px] py-[9px] text-[13.5px] font-semibold text-navy"
        >
          Add role
        </button>
      </div>
    </div>
  );
}
