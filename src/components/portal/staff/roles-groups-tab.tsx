"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  assignRoleToGroup,
  deleteGroup,
  deleteRole,
  moveGroup,
  saveGroup,
  saveRole,
} from "@/lib/actions/roles";
import type { RoleDef, RoleGroup } from "@/types/domain";

// Admin-only Roles & groups tab: create/delete roles, organise them into ordered
// groups that band and sort the weekly roster. Staff assignment counts show how
// many team members hold each role.
export function RolesGroupsTab({
  roles,
  groups,
  roleCounts,
}: {
  roles: RoleDef[];
  groups: RoleGroup[];
  roleCounts: Record<string, number>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Fire a void server action, surfacing any thrown error in the banner.
  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  };

  const fd = (entries: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries(entries)) f.set(k, v);
    return f;
  };

  const rolesOf = (groupId: string) => roles.filter((r) => r.groupId === groupId);
  const unassigned = roles.filter((r) => r.groupId == null);

  return (
    <div className="mt-6 flex flex-col gap-6">
      {error && (
        <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
          {error}
        </p>
      )}

      {/* ---- ordered groups (drive the roster banding) ---- */}
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-serif text-[19px] font-semibold text-ink">Groups</h3>
          <span className="text-[12.5px] text-ink-faint">Order sets the roster banding, top to bottom.</span>
        </div>
        <div className="flex flex-col gap-3">
          {groups.map((g, i) => {
            const members = rolesOf(g.id);
            const staffCount = members.reduce((a, r) => a + (roleCounts[r.name] ?? 0), 0);
            const addable = roles.filter((r) => r.groupId !== g.id);
            return (
              <div key={g.id} className="rounded-[14px] border border-line bg-cream-2 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-[7px] text-[12px] font-bold" style={{ background: g.color, color: "#F4EEE2" }}>
                    {i + 1}
                  </span>
                  <span className="font-serif text-[17px] font-semibold text-ink">{g.label}</span>
                  <span className="rounded-full px-[9px] py-[2px] text-[12px] font-semibold" style={{ background: g.tint, color: g.color }}>
                    {staffCount} {staffCount === 1 ? "person" : "people"}
                  </span>
                  <div className="ml-auto flex items-center gap-[6px]">
                    <button type="button" aria-label="Move up" disabled={i === 0}
                      onClick={() => run(() => moveGroup(g.id, -1))}
                      className="flex size-8 items-center justify-center rounded-[8px] border border-line-soft bg-cream text-ink-soft disabled:text-line-strong">↑</button>
                    <button type="button" aria-label="Move down" disabled={i === groups.length - 1}
                      onClick={() => run(() => moveGroup(g.id, 1))}
                      className="flex size-8 items-center justify-center rounded-[8px] border border-line-soft bg-cream text-ink-soft disabled:text-line-strong">↓</button>
                    <button type="button" aria-label="Delete group"
                      onClick={() => run(() => deleteGroup(fd({ id: g.id })))}
                      className="flex size-8 items-center justify-center rounded-[8px] border border-rust/25 bg-rust-tint text-[15px] text-rust">×</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {members.length ? members.map((r) => (
                    <span key={r.name} className="inline-flex items-center gap-[6px] rounded-full border border-line-soft bg-cream px-[10px] py-[3px] text-[12.5px] font-medium text-ink-soft">
                      {r.name}
                      <span className="text-ink-faint">· {roleCounts[r.name] ?? 0}</span>
                      <button type="button" aria-label={`Remove ${r.name} from ${g.label}`}
                        onClick={() => run(() => assignRoleToGroup(r.name, null))}
                        className="text-[13px] leading-none text-rust">×</button>
                    </span>
                  )) : (
                    <span className="text-[13px] text-ink-faint">No roles in this group yet.</span>
                  )}
                  {addable.length > 0 && (
                    <select
                      value=""
                      onChange={(e) => { if (e.target.value) run(() => assignRoleToGroup(e.target.value, g.id)); }}
                      className="rounded-[9px] border border-dashed border-line-strong bg-cream px-[10px] py-[4px] text-[12.5px] text-ink-soft"
                    >
                      <option value="">+ Add role…</option>
                      {addable.map((r) => (
                        <option key={r.name} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <AddForm action={saveGroup} field="label" placeholder="New group name" cta="Add group" />
      </section>

      {/* ---- unassigned roles ---- */}
      {unassigned.length > 0 && (
        <section>
          <h3 className="mb-2 font-serif text-[19px] font-semibold text-ink">Unassigned roles</h3>
          <div className="flex flex-wrap gap-2">
            {unassigned.map((r) => (
              <div key={r.name} className="inline-flex items-center gap-2 rounded-full border border-line-soft bg-cream-2 px-[12px] py-[6px] text-[13px] font-medium text-ink-soft">
                {r.name} <span className="text-ink-faint">· {roleCounts[r.name] ?? 0}</span>
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) run(() => assignRoleToGroup(r.name, e.target.value)); }}
                  className="rounded-[8px] border border-line-soft bg-cream px-[8px] py-[3px] text-[12px]"
                >
                  <option value="">Assign to…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---- role registry ---- */}
      <section>
        <h3 className="mb-2 font-serif text-[19px] font-semibold text-ink">All roles</h3>
        <div className="overflow-hidden rounded-[14px] border border-line bg-cream-2">
          {roles.map((r) => {
            const used = roleCounts[r.name] ?? 0;
            const group = groups.find((g) => g.id === r.groupId);
            return (
              <div key={r.name} className="flex items-center gap-3 border-b border-line-soft px-4 py-[11px] last:border-b-0">
                <span className="size-3 rounded-[4px]" style={{ background: r.color }} />
                <span className="text-[14px] font-semibold text-ink">{r.name}</span>
                <span className="text-[12.5px] text-ink-faint">{group ? group.label : "Unassigned"} · {used} staff</span>
                <button type="button" aria-label={`Delete role ${r.name}`}
                  onClick={() => run(() => deleteRole(fd({ name: r.name })))}
                  className="ml-auto flex size-8 items-center justify-center rounded-[8px] border border-rust/25 bg-rust-tint text-[15px] text-rust">×</button>
              </div>
            );
          })}
          {roles.length === 0 && (
            <div className="px-4 py-8 text-center text-[14px] text-ink-faint">No roles yet.</div>
          )}
        </div>
        <AddForm action={saveRole} field="name" placeholder="New role name" cta="Add role" />
      </section>
    </div>
  );
}

// Shared inline "add" form (role or group). Resets its input once the action
// returns without an error.
function AddForm({
  action,
  field,
  placeholder,
  cta,
}: {
  action: (prev: { error?: string }, fd: FormData) => Promise<{ error?: string }>;
  field: string;
  placeholder: string;
  cta: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [value, setValue] = useState("");
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) setValue("");
    wasPending.current = pending;
  }, [pending, state.error]);
  return (
    <form action={formAction} className="mt-3">
      <div className="flex gap-2">
        <input
          name={field}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-[240px] rounded-[10px] border border-line-soft bg-cream-2 px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-navy"
        />
        <button type="submit" disabled={pending}
          className="whitespace-nowrap rounded-[10px] bg-navy-tint px-[15px] py-[9px] text-[13.5px] font-semibold text-navy disabled:opacity-60">
          {cta}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-2 text-[12.5px] font-medium text-high">{state.error}</p>
      )}
    </form>
  );
}
