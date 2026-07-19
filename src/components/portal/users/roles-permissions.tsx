"use client";

import { useState, useTransition } from "react";
import { countGranted, getModules } from "@/lib/mock-data";
import { userRoleMeta } from "@/lib/design-meta";
import { renameUserRole } from "@/lib/actions/user-roles";
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
  roles,
  perms,
  selectedRole,
  onSelectRole,
  togglePerm,
}: {
  users: User[];
  roles: { id: UserRole; label: string; isSystem: boolean }[];
  perms: PermissionMatrix;
  selectedRole: UserRole;
  onSelectRole: (r: UserRole) => void;
  togglePerm: (role: UserRole, module: ModuleKey, action: PermissionAction) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Inline rename on the selected role's card, mirroring Staff > Roles & groups.
  const [renaming, setRenaming] = useState<UserRole | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const modules = getModules();
  const total = modules.length * PERMISSION_ACTIONS.length;
  const selRole = roles.find((r) => r.id === selectedRole);
  const sel = userRoleMeta[selectedRole];
  const selPerms = perms[selectedRole];
  const selGranted = countGranted(modules, selPerms);
  const locked = selectedRole === "super_admin";

  const startRename = (r: UserRole, label: string) => {
    setError(null);
    setRenaming(r);
    setRenameValue(label);
  };
  const submitRename = (r: UserRole, oldLabel: string) => {
    const label = renameValue.trim();
    setRenaming(null);
    if (!label || label === oldLabel) return;
    startTransition(async () => {
      const res = await renameUserRole(r, label);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div className="mt-5 grid grid-cols-[300px_1fr] items-start gap-4 max-lg:grid-cols-1">
      {/* role cards */}
      <div className="flex flex-col gap-[10px]">
        {error && (
          <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
            {error}
          </p>
        )}
        {roles.map(({ id: r, label, isSystem }) => {
          const meta = userRoleMeta[r];
          const on = r === selectedRole;
          const granted = countGranted(modules, perms[r]);
          const userCount = users.filter((u) => u.role === r).length;
          const isRenaming = renaming === r;
          return (
            <div
              key={r}
              className={cn(
                "block w-full rounded-[14px] border px-[15px] py-[14px] text-left transition-colors",
                on
                  ? cn(tintOf(r), borderOf(r), "shadow-sm")
                  : "border-line bg-cream-2",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                {isRenaming ? (
                  <div className="flex flex-1 items-center gap-[6px]">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitRename(r, label);
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      className="w-full rounded-[8px] border border-line-soft bg-cream px-[9px] py-[5px] text-[14px] text-ink outline-none focus:border-navy"
                    />
                    <button type="button" aria-label="Save name"
                      onClick={() => submitRename(r, label)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-sage/30 bg-sage-tint text-[13px] font-bold text-sage">✓</button>
                    <button type="button" aria-label="Cancel rename"
                      onClick={() => setRenaming(null)}
                      className="flex size-7 shrink-0 items-center justify-center rounded-[8px] border border-line-soft bg-cream text-[14px] text-ink-soft">×</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelectRole(r)}
                    className="flex flex-1 items-center gap-[9px] text-left text-[15px] font-semibold text-ink"
                  >
                    <span className={cn("size-[10px] shrink-0 rounded-full", meta.dot)} />
                    {label}
                  </button>
                )}
                {!isRenaming && (
                  <div className="flex shrink-0 items-center gap-[6px]">
                    <span className="text-[12px] font-semibold text-ink-faint">
                      {userCount}
                    </span>
                    {!isSystem && (
                      <button type="button" aria-label={`Rename role ${label}`}
                        onClick={() => startRename(r, label)}
                        className="flex size-6 items-center justify-center rounded-[6px] text-ink-faint hover:bg-cream hover:text-navy">
                        <Icon name="edit" size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onSelectRole(r)} className="block w-full text-left">
                <div className="mt-[6px] text-[12.5px] leading-[1.4] text-ink-muted">
                  {meta.desc}
                </div>
                <div className={cn("mt-2 text-[11.5px] font-semibold", meta.text)}>
                  {granted} permissions
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {/* permission matrix */}
      <div className="overflow-hidden rounded-2xl border border-line bg-cream-2">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line-divider px-6 py-5">
          <div>
            <div className="flex items-center gap-[10px]">
              <span className={cn("size-[11px] rounded-full", sel.dot)} />
              <h3 className="font-serif text-[22px] font-semibold">{selRole?.label ?? sel.label}</h3>
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
            Super Admin has unrestricted access - these permissions can&apos;t be
            changed.
          </div>
        )}

        <div className="overflow-x-auto px-6 pb-4 pt-2">
          <div className="min-w-[440px]">
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
    </div>
  );
}
