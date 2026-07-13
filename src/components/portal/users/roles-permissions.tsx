import { countGranted, getModules, ROLE_KEYS } from "@/lib/mock-data";
import { userRoleMeta } from "@/lib/design-meta";
import { Icon } from "@/components/shared/icons";
import type {
  ModuleKey,
  PermissionAction,
  PermissionMatrix,
  User,
  UserRole,
} from "@/types/domain";
import { cn } from "@/lib/utils";
import { PermissionSwitch } from "./permission-switch";

const PERMISSION_ACTIONS: { key: PermissionAction; label: string }[] = [
  { key: "view", label: "View" },
  { key: "create", label: "Create" },
  { key: "edit", label: "Edit" },
  { key: "delete", label: "Delete" },
];

const MATRIX_COLS = "grid-cols-[1.6fr_repeat(4,1fr)]";

// Role color meta only exposes a bg ("bg-navy") for the dot; derive the tint
// bg + border from it so cards/badges carry each role's accent.
const tintOf = (role: UserRole) => userRoleMeta[role].badge.split(" ")[0];
const borderOf = (role: UserRole) =>
  userRoleMeta[role].dot.replace("bg-", "border-");

export function RolesPermissions({
  users,
  perms,
  selectedRole,
  onSelectRole,
  togglePerm,
}: {
  users: User[];
  perms: PermissionMatrix;
  selectedRole: UserRole;
  onSelectRole: (r: UserRole) => void;
  togglePerm: (role: UserRole, module: ModuleKey, action: PermissionAction) => void;
}) {
  const modules = getModules();
  const total = modules.length * PERMISSION_ACTIONS.length;
  const sel = userRoleMeta[selectedRole];
  const selPerms = perms[selectedRole];
  const selGranted = countGranted(modules, selPerms);
  const locked = selectedRole === "super_admin";

  return (
    <div className="mt-5 grid grid-cols-[300px_1fr] items-start gap-4 max-lg:grid-cols-1">
      {/* role cards */}
      <div className="flex flex-col gap-[10px]">
        {ROLE_KEYS.map((r) => {
          const meta = userRoleMeta[r];
          const on = r === selectedRole;
          const granted = countGranted(modules, perms[r]);
          const userCount = users.filter((u) => u.role === r).length;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onSelectRole(r)}
              className={cn(
                "block w-full rounded-[14px] border px-[15px] py-[14px] text-left transition-colors",
                on
                  ? cn(tintOf(r), borderOf(r), "shadow-sm")
                  : "border-line bg-cream-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-[9px] text-[15px] font-semibold text-ink">
                  <span className={cn("size-[10px] rounded-full", meta.dot)} />
                  {meta.label}
                </span>
                <span className="text-[12px] font-semibold text-ink-faint">
                  {userCount}
                </span>
              </div>
              <div className="mt-[6px] text-[12.5px] leading-[1.4] text-ink-muted">
                {meta.desc}
              </div>
              <div className={cn("mt-2 text-[11.5px] font-semibold", meta.text)}>
                {granted} permissions
              </div>
            </button>
          );
        })}
      </div>

      {/* permission matrix */}
      <div className="overflow-hidden rounded-2xl border border-line bg-cream-2">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-divider px-6 py-5">
          <div>
            <div className="flex items-center gap-[10px]">
              <span className={cn("size-[11px] rounded-full", sel.dot)} />
              <h3 className="font-serif text-[22px] font-semibold">{sel.label}</h3>
            </div>
            <p className="mt-[6px] max-w-[440px] text-[13.5px] text-ink-muted">
              {sel.desc}
            </p>
          </div>
          <div className="text-right">
            <div className="font-serif text-[26px] leading-none text-ink">
              {selGranted}
              <span className="text-[15px] text-ink-faint"> / {total}</span>
            </div>
            <div className="text-[12px] text-ink-faint">permissions granted</div>
          </div>
        </div>

        {locked && (
          <div className="mx-6 mt-4 flex items-center gap-[9px] rounded-[11px] border border-navy/25 bg-navy-tint px-[15px] py-[11px] text-[13px] text-navy">
            <Icon name="lock" size={16} />
            Super Admin has unrestricted access — these permissions can&apos;t be
            changed.
          </div>
        )}

        <div className="px-6 pb-4 pt-2">
          <div
            className={cn(
              "grid items-center border-b border-line-divider pb-[10px] pt-[14px]",
              MATRIX_COLS,
            )}
          >
            <div className="text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint">
              Module
            </div>
            {PERMISSION_ACTIONS.map((a) => (
              <div
                key={a.key}
                className="text-center text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint"
              >
                {a.label}
              </div>
            ))}
          </div>

          {modules.map((m) => (
            <div
              key={m.key}
              className={cn(
                "grid items-center border-b border-line-soft py-[13px] last:border-b-0",
                MATRIX_COLS,
              )}
            >
              <div className="text-[14px] font-semibold text-ink-soft">
                {m.label}
              </div>
              {PERMISSION_ACTIONS.map((a) => (
                <div key={a.key} className="flex justify-center">
                  <PermissionSwitch
                    on={selPerms[m.key][a.key]}
                    locked={locked}
                    onToggle={() => togglePerm(selectedRole, m.key, a.key)}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
