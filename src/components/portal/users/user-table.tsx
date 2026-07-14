import { PersonBadge } from "@/components/shared/person-badge";
import { Icon } from "@/components/shared/icons";
import { userRoleMeta, userStatusMeta } from "@/lib/design-meta";
import type { User } from "@/types/domain";
import { cn } from "@/lib/utils";

const COLS = "grid-cols-[2.2fr_1.3fr_1.5fr_1fr_1fr_88px]";

// Users table: avatar+name+email, role badge, scope, status dot, last active,
// and per-row Edit / Remove actions. Rows are pre-filtered by the caller;
// edit/delete act on the user identity, not the filtered index.
export function UserTable({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-cream-2">
      <div className="min-w-[720px]">
      <div
        className={cn(
          "grid gap-[14px] border-b border-line-divider px-[22px] py-[14px] text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint",
          COLS,
        )}
      >
        <div>User</div>
        <div>Role</div>
        <div>Scope</div>
        <div>Status</div>
        <div>Last active</div>
        <div />
      </div>

      {users.map((u) => {
        const role = userRoleMeta[u.role];
        const status = userStatusMeta[u.status];
        return (
          <div
            key={u.email}
            className={cn(
              "grid items-center gap-[14px] border-b border-line-soft px-[22px] py-[15px] last:border-b-0",
              COLS,
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <PersonBadge
                initials={u.initials}
                color={u.color}
                className="size-10 rounded-full text-[13.5px]"
              />
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold text-ink">
                  {u.name}
                </div>
                <div className="truncate text-[12.5px] text-ink-faint">
                  {u.email}
                </div>
              </div>
            </div>

            <div>
              <span
                className={cn(
                  "rounded-full px-[11px] py-[5px] text-[12.5px] font-bold",
                  role.badge,
                )}
              >
                {role.label}
              </span>
            </div>

            <div className="text-[13.5px] text-ink-soft">{u.scope}</div>

            <div className="flex items-center gap-[7px]">
              <span className={cn("size-2 shrink-0 rounded-full", status.dot)} />
              <span className="text-[13.5px] text-ink-soft">{u.status}</span>
            </div>

            <div className="text-[13px] text-ink-faint">{u.last}</div>

            <div className="flex justify-end gap-[6px]">
              <button
                type="button"
                onClick={() => onEdit(u)}
                title="Edit"
                aria-label={`Edit ${u.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-line-soft bg-cream text-navy"
              >
                <Icon name="edit" size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(u)}
                title="Remove"
                aria-label={`Remove ${u.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-rust/25 bg-rust-tint text-rust"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
