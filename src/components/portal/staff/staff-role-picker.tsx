import { cn } from "@/lib/utils";

// Editable role picker for the staff form: click a chip to select; add a new
// role via the input + button; remove via the chip's × — but only when the
// role is neither the last one nor assigned to any staff member (usedRoles).
export function StaffRolePicker({
  roles,
  selected,
  usedRoles,
  newRole,
  onSelect,
  onRemove,
  onNewRoleChange,
  onAdd,
}: {
  roles: string[];
  selected: string;
  usedRoles: string[];
  newRole: string;
  onSelect: (role: string) => void;
  onRemove: (role: string) => void;
  onNewRoleChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <span className="mb-[9px] block text-[12.5px] font-bold text-ink-soft">Role</span>
      <div className="grid grid-cols-2 gap-[9px]">
        {roles.map((r) => {
          const on = selected === r;
          const removable = roles.length > 1 && !usedRoles.includes(r);
          return (
            <div key={r} className="relative flex">
              <button
                type="button"
                onClick={() => onSelect(r)}
                className={cn(
                  "w-full rounded-[11px] border-[1.5px] py-[10px] text-left text-[13px] font-semibold transition-colors",
                  removable ? "pl-3 pr-8" : "px-3",
                  on ? "border-navy bg-navy-tint text-navy" : "border-line-soft bg-cream-2 text-ink-soft",
                )}
              >
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
