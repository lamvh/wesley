"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveLeave } from "@/lib/actions/staff";
import type { StaffRecord } from "@/types/domain";

const LEAVE_TYPES = ["Annual leave", "Sick leave", "Shift swap"] as const;

const fieldCls =
  "rounded-[11px] border border-input bg-cream-2 px-[14px] py-[10px] text-[14.5px] text-ink outline-none focus:border-navy";
const labelCls = "text-[12.5px] font-bold text-ink-soft";

// Add-leave modal. No edit flow — leave requests are created once, then
// resolved via Approve/Decline on the tab, so this form is always "add".
// Same reset-via-remount idiom as the other portal forms: the parent mounts
// this fresh (`key=` remount) each time it opens, which resets both the
// uncontrolled fields and the useActionState result.
export function LeaveForm({
  staff,
  onClose,
}: {
  staff: StaffRecord[];
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(saveLeave, {});
  const wasPending = useRef(false);

  // Once a submit finishes without an error, the request is saved — close.
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
          <h3 className="font-serif text-[24px] font-semibold text-ink">Add leave</h3>
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
          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>
              Staff<span className="text-high"> *</span>
            </span>
            <select name="staffId" required defaultValue="" className={fieldCls}>
              <option value="" disabled>Select a staff member</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>
              Type<span className="text-high"> *</span>
            </span>
            <select name="type" required defaultValue={LEAVE_TYPES[0]} className={fieldCls}>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>From</span>
              <input name="from" type="date" className={fieldCls} />
            </label>
            <label className="flex flex-col gap-[6px]">
              <span className={labelCls}>To</span>
              <input name="to" type="date" className={fieldCls} />
            </label>
          </div>

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>Days</span>
            <input name="days" type="number" min="0" step="1" defaultValue={1} className={fieldCls} />
          </label>

          <label className="flex flex-col gap-[6px]">
            <span className={labelCls}>Note</span>
            <input name="note" type="text" placeholder="Optional note" className={fieldCls} />
          </label>

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
              {pending ? "Saving…" : "Add leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
