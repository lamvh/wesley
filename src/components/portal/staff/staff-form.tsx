"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { saveStaff } from "@/lib/actions/staff";
import { staffContractMeta } from "@/lib/design-meta";
import type { StaffRecord } from "@/types/domain";

const ROLE_CHOICES = ["Carer", "Registered Nurse", "Team Leader", "Activities"] as const;
const CONTRACT_CHOICES = ["Full-time", "Part-time", "Casual"] as const;

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

// Add/edit staff modal. Same reset-via-remount idiom as StockItemForm — the
// parent mounts this fresh per staffer (or blank for "add"), which resets
// both uncontrolled fields and the useActionState result for the new target.
export function StaffForm({
  staff,
  onClose,
}: {
  staff: StaffRecord | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveStaff, {});
  const wasPending = useRef(false);
  const editing = Boolean(staff);

  // Role/contract are choice-grids, not native inputs, so their value is
  // tracked in state and mirrored to hidden fields for the form action.
  const [role, setRole] = useState(staff?.role ?? ROLE_CHOICES[0]);
  const [contract, setContract] = useState(staff?.contract ?? CONTRACT_CHOICES[0]);

  // Once a submit finishes without an error, the staffer is saved — close.
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) {
      onClose();
    }
    wasPending.current = pending;
  }, [pending, state.error, onClose]);

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

          <div>
            <span className={cn(labelCls, "mb-[9px] block")}>Role</span>
            <div className="grid grid-cols-2 gap-[9px]">
              {ROLE_CHOICES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-[11px] border-[1.5px] px-3 py-[10px] text-left text-[13px] font-semibold transition-colors",
                    role === r ? "border-navy bg-navy-tint text-navy" : "border-line-soft bg-cream-2 text-ink-soft",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

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
