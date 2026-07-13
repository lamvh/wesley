import { ROLE_KEYS } from "@/lib/mock-data";
import { userRoleMeta } from "@/lib/design-meta";
import type { User, UserRole } from "@/types/domain";
import { cn } from "@/lib/utils";

type Filter = UserRole | "all";

// Role filter pills above the users table. Selected pill = navy fill.
export function RoleFilterPills({
  users,
  active,
  onSelect,
}: {
  users: User[];
  active: Filter;
  onSelect: (f: Filter) => void;
}) {
  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All users", count: users.length },
    ...ROLE_KEYS.map((r) => ({
      key: r,
      label: userRoleMeta[r].label,
      count: users.filter((u) => u.role === r).length,
    })),
  ];

  return (
    <div className="mt-5 flex flex-wrap gap-[9px]">
      {filters.map((f) => {
        const on = f.key === active;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onSelect(f.key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-[14px] py-[7px] text-[13.5px] font-semibold transition-colors",
              on
                ? "border-navy bg-navy text-cream"
                : "border-line-soft bg-cream-2 text-ink-muted",
            )}
          >
            {f.label}
            <span className="opacity-65">{f.count}</span>
          </button>
        );
      })}
    </div>
  );
}
