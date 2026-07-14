"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { saveStaff } from "@/lib/actions/staff";
import { staffContractMeta } from "@/lib/design-meta";
import { StaffRolePicker } from "@/components/portal/staff/staff-role-picker";
import type { StaffRecord } from "@/types/domain";

const CONTRACT_CHOICES = ["Full-time", "Part-time", "Casual"] as const;
const VISA_TYPES = [
  "NZ Citizen", "Permanent Resident", "Work Visa",
  "Student Visa", "Working Holiday", "Essential Skills",
] as const;
// Citizens / permanent residents have no visa expiry to record.
const visaNeedsExpiry = (v: string) => v !== "NZ Citizen" && v !== "Permanent Resident";

const fieldCls =
  "rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[14.5px] text-ink outline-none focus:border-navy";
const labelCls = "text-[12.5px] font-bold text-ink-soft";

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-[6px]">
      <span className={labelCls}>
        {label}
        {required && <span className="text-high"> *</span>}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={fieldCls}
      />
    </label>
  );
}

// Add/edit staff modal. Role is CRUD-managed inline (see StaffRolePicker) and
// mirrored to a hidden field; visa type/expiry persist via the form action.
// Same reset-via-remount idiom as StockItemForm — parent mounts fresh per target.
export function StaffForm({
  staff,
  roleOptions,
  usedRoles,
  onClose,
}: {
  staff: StaffRecord | null;
  roleOptions: string[];
  usedRoles: string[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveStaff, {});
  const wasPending = useRef(false);
  const editing = Boolean(staff);

  // Role/contract are choice-grids, not native inputs, so their value is
  // tracked in state and mirrored to hidden fields for the form action.
  const [roles, setRoles] = useState<string[]>(roleOptions);
  const [role, setRole] = useState(staff?.role ?? roleOptions[0] ?? "");
  const [newRole, setNewRole] = useState("");
  const [contract, setContract] = useState(staff?.contract ?? CONTRACT_CHOICES[0]);
  const [visaType, setVisaType] = useState(staff?.visaType || VISA_TYPES[0]);
  const [visaExpiry, setVisaExpiry] = useState(staff?.visaExpiry ?? "");

  // Once a submit finishes without an error, the staffer is saved — close.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onClose();
    }
    wasPending.current = pending;
  }, [pending, state.error, onClose]);

  function addRole() {
    const v = newRole.trim();
    if (!v) return;
    setNewRole("");
    setRoles((prev) => (prev.includes(v) ? prev : [...prev, v]));
  }

  function removeRole(r: string) {
    setRoles((prev) => {
      const next = prev.filter((x) => x !== r);
      if (r === role) setRole(next[0] ?? "");
      return next;
    });
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-[540px] max-w-full overflow-y-auto rounded-[18px] border border-line-soft bg-cream"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold text-ink">
              {editing ? "Edit staff" : "Add staff"}
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-faint">
              Add them to the roster and staff directory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-[26px] leading-none text-ink-faint"
          >
            ×
          </button>
        </div>

        <form action={action} className="flex flex-col gap-4 px-[26px] py-6">
          {staff && <input type="hidden" name="id" value={staff.id} />}
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="contract" value={contract} />

          <Field
            label="Full name"
            name="name"
            defaultValue={staff?.name}
            required
            placeholder="e.g. Ana Reti"
          />

          <StaffRolePicker
            roles={roles}
            selected={role}
            usedRoles={usedRoles}
            newRole={newRole}
            onSelect={setRole}
            onRemove={removeRole}
            onNewRoleChange={setNewRole}
            onAdd={addRole}
          />

          <div>
            <span className={cn(labelCls, "mb-[9px] block")}>Contract</span>
            <div className="grid grid-cols-3 gap-[9px]">
              {CONTRACT_CHOICES.map((c) => {
                const meta = staffContractMeta[c];
                const on = contract === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setContract(c)}
                    className={cn(
                      "rounded-[11px] border-[1.5px] px-3 py-[10px] text-center text-[13px] font-semibold transition-colors",
                      on
                        ? cn(meta.badge.split(" ")[0], meta.dot.replace("bg-", "border-"), meta.text)
                        : "border-line-soft bg-cream-2 text-ink-soft",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <Field label="Phone" name="phone" defaultValue={staff?.phone} placeholder="021 …" />

          <div className="grid grid-cols-2 gap-[14px]">
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>Work visa type</span>
              <select
                name="visaType"
                value={visaType}
                onChange={(e) => setVisaType(e.target.value)}
                className={fieldCls}
              >
                {VISA_TYPES.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </label>
            {visaNeedsExpiry(visaType) && (
              <label className="flex flex-col gap-[6px]">
                <span className={labelCls}>Visa expiry date</span>
                <input
                  type="date"
                  name="visaExpiry"
                  value={visaExpiry}
                  onChange={(e) => setVisaExpiry(e.target.value)}
                  className={fieldCls}
                />
              </label>
            )}
          </div>

          {state.error && (
            <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
              {state.error}
            </p>
          )}

          <div className="mt-1 flex justify-end gap-[10px] border-t border-line pt-5">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-[11px] border border-line-soft bg-cream-2 px-[18px] py-[11px] text-[14px] font-semibold text-ink-soft"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-[11px] bg-navy px-5 py-[11px] text-[14px] font-semibold text-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : editing ? "Save changes" : "Add staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
