"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getBuildings } from "@/lib/mock-data";
import { saveShiftTemplate } from "@/lib/actions/staff";
import type { RoleDef, ShiftTemplate } from "@/types/domain";

// The 12 shift-template base colours. saveShiftTemplate resolves the matching
// tint/border server-side by exact hex match against SHIFT_PALETTE, so the
// picker must only ever submit one of these values.
const SHIFT_COLORS = [
  "#87651A", "#8A6516", "#9A4A70", "#8a6ba3", "#A24E2A", "#BE7350",
  "#3B4E74", "#2C5A6E", "#5b8f9a", "#3F5137", "#6E5A2A", "#93502F",
] as const;

const fieldCls =
  "rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[14.5px] text-ink outline-none focus:border-navy";
const labelCls = "text-[12.5px] font-bold text-ink-soft";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  min,
  step,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  min?: string;
  step?: string;
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
        type={type}
        min={min}
        step={step}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={fieldCls}
      />
    </label>
  );
}

// Add/edit shift-template modal. Same reset-via-remount idiom as the other
// portal forms — the parent mounts this fresh per template (or blank for
// "add"), which resets both uncontrolled fields and the useActionState result.
export function ShiftTemplateForm({
  shift,
  roles,
  onClose,
}: {
  shift: ShiftTemplate | null;
  roles: RoleDef[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveShiftTemplate, {});
  const wasPending = useRef(false);
  const editing = Boolean(shift);
  const buildings = getBuildings();

  // Colour, role and building are swatch/button pickers, not native inputs —
  // tracked in state and mirrored to hidden fields for the form action.
  const [color, setColor] = useState(shift?.color ?? SHIFT_COLORS[0]);
  const [role, setRole] = useState(shift?.role ?? roles[0]?.name ?? "");
  const [building, setBuilding] = useState(shift?.building ?? buildings[0]?.id ?? "");

  // Once a submit finishes without an error, the template is saved — close.
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
              {editing ? "Edit shift template" : "Add shift template"}
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-faint">
              Shift patterns used to build the weekly roster.
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
          {shift && <input type="hidden" name="id" value={shift.id} />}
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="building" value={building} />

          <Field
            label="Shift name"
            name="name"
            defaultValue={shift?.name}
            required
            placeholder="e.g. Morning"
          />

          <div>
            <span className={cn(labelCls, "mb-[9px] block")}>Role</span>
            <div className="grid grid-cols-3 gap-[9px] max-sm:grid-cols-2">
              {roles.map((r) => (
                <button
                  key={r.name}
                  type="button"
                  onClick={() => setRole(r.name)}
                  aria-pressed={role === r.name}
                  style={
                    role === r.name
                      ? { color: r.color, background: r.tint, borderColor: r.color }
                      : undefined
                  }
                  className={cn(
                    "cursor-pointer truncate rounded-[10px] border px-[10px] py-[8px] text-[12.5px] font-semibold transition",
                    role === r.name ? "" : "border-line-soft bg-cream-2 text-ink-soft",
                  )}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <p className="mt-[7px] text-[12px] text-ink-faint">
              Only staff in this role can be assigned this shift on the roster.
            </p>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>Building</span>
            <select
              value={building}
              onChange={(e) => setBuilding(e.target.value)}
              className={fieldCls}
            >
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <span className="text-[12px] text-ink-faint">
              Shifts are grouped by building on the roster.
            </span>
          </label>

          <Field
            label="Time"
            name="time"
            defaultValue={shift?.time}
            placeholder="e.g. 6:45 – 15:15"
          />

          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <Field label="Required" name="req" type="number" min="0" defaultValue={shift?.req ?? 1} />
            <Field label="Filled" name="filled" type="number" min="0" defaultValue={shift?.filled ?? 0} />
            <Field
              label="Paid hours"
              name="paidHours"
              type="number"
              min="0"
              step="0.25"
              defaultValue={shift?.paidHours || ""}
              placeholder="8"
            />
          </div>
          <p className="-mt-2 text-[12px] text-ink-faint">
            Paid hours per shift feed straight into wage calculations.
          </p>

          <div>
            <span className={cn(labelCls, "mb-[9px] block")}>Colour</span>
            <div className="flex flex-wrap gap-[9px]">
              {SHIFT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select colour ${c}`}
                  aria-pressed={color === c}
                  style={{ background: c }}
                  className={cn(
                    "size-8 shrink-0 cursor-pointer rounded-[9px] border-2 transition",
                    color === c ? "border-ink" : "border-transparent",
                  )}
                />
              ))}
            </div>
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
              {pending ? "Saving…" : editing ? "Save changes" : "Add shift"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
