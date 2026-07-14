"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { saveShiftTemplate } from "@/lib/actions/staff";
import type { ShiftTemplate } from "@/types/domain";

// The 6 seed shift-template base colours (scripts/db/seed-staff.mts /
// supabase/migrations/0003_staff_admin.sql). saveShiftTemplate resolves the
// matching tint/border server-side by exact hex match against this set, so
// the picker must only ever submit one of these values.
const SHIFT_COLORS = [
  "#87651A",
  "#8A6516",
  "#9A4A70",
  "#A24E2A",
  "#3B4E74",
  "#2C5A6E",
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
  placeholder,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  min?: string;
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
// "add"), which resets both uncontrolled fields and the useActionState
// result for the new target.
export function ShiftTemplateForm({
  shift,
  onClose,
}: {
  shift: ShiftTemplate | null;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveShiftTemplate, {});
  const wasPending = useRef(false);
  const editing = Boolean(shift);

  // Colour is a swatch picker, not a native input — its value is tracked in
  // state and mirrored to a hidden field for the form action.
  const [color, setColor] = useState(shift?.color ?? SHIFT_COLORS[0]);

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
        className="max-h-[90vh] w-[520px] max-w-full overflow-y-auto rounded-[18px] border border-line-soft bg-cream"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold text-ink">
              {editing ? "Edit shift template" : "Add shift template"}
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-faint">Defines a recurring roster slot.</p>
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

          <Field
            label="Shift name"
            name="name"
            defaultValue={shift?.name}
            required
            placeholder="e.g. Morning"
          />

          <Field
            label="Time"
            name="time"
            defaultValue={shift?.time}
            placeholder="e.g. 6:45 – 15:15"
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Required" name="req" type="number" min="0" defaultValue={shift?.req ?? 0} />
            <Field label="Filled" name="filled" type="number" min="0" defaultValue={shift?.filled ?? 0} />
          </div>

          <div>
            <span className={cn(labelCls, "mb-[9px] block")}>Colour</span>
            <div className="flex gap-[9px]">
              {SHIFT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Select colour ${c}`}
                  aria-pressed={color === c}
                  style={{ background: c }}
                  className={cn(
                    "size-8 shrink-0 cursor-pointer rounded-full border-2 transition",
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
