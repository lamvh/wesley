"use client";

import { cn } from "@/lib/utils";
import type { DutyForm, DutyOption } from "@/types/domain";

interface DutyRosterModalProps {
  open: boolean;
  form: DutyForm;
  dayOptions: DutyOption[];
  onScope: (scope: DutyForm["scope"]) => void;
  onDay: (day: number) => void;
  onCancel: () => void;
  onGenerate: () => void;
}

const selectCls =
  "w-full rounded-[10px] border border-duty-rule bg-cream-2 px-3 py-[10px] text-[14px] text-ink outline-none focus:border-navy";
const labelCls = "mb-[7px] block text-[12.5px] font-bold text-ink-nav";

// Config step of the "Export duty roster" flow: pick a scope (single day /
// whole week). The parent (RosterView) owns `form`; "Generate & preview" hands
// off to the print overlay.
export function DutyRosterModal({
  open,
  form,
  dayOptions,
  onScope,
  onDay,
  onCancel,
  onGenerate,
}: DutyRosterModalProps) {
  if (!open) return null;

  const scopeBtn = (on: boolean) =>
    cn(
      "flex-1 cursor-pointer rounded-[9px] px-[14px] py-[9px] text-[13.5px] font-semibold transition-colors",
      on ? "bg-navy-deep text-cream" : "bg-transparent text-ink-muted",
    );

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy-deep/50 p-6 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[460px] max-w-full rounded-[18px] border border-line-soft bg-cream shadow-[0_30px_80px_-20px_rgba(20,24,40,0.5)]"
      >
        <div className="flex items-start justify-between border-b border-line px-[26px] py-[22px]">
          <div>
            <h3 className="font-serif text-[24px] font-semibold text-ink">
              Export duty roster
            </h3>
            <p className="mt-[5px] text-[13.5px] text-ink-faint">
              A print-ready sheet built from the roster you see.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="cursor-pointer text-[26px] leading-none text-ink-faint"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-[18px] px-[26px] py-[22px]">
          <div>
            <span className={labelCls}>What to export</span>
            <div className="flex gap-1 rounded-[11px] border border-duty-rule bg-toggle-track p-1">
              <button type="button" onClick={() => onScope("day")} className={scopeBtn(form.scope === "day")}>
                Single day
              </button>
              <button type="button" onClick={() => onScope("week")} className={scopeBtn(form.scope === "week")}>
                Whole week
              </button>
            </div>
          </div>

          {form.scope === "day" && (
            <label className="block">
              <span className={labelCls}>Day</span>
              <select
                value={String(form.day)}
                onChange={(e) => onDay(parseInt(e.target.value, 10) || 0)}
                className={selectCls}
              >
                {dayOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="flex justify-end gap-[10px] px-[26px] pb-[22px] pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-[11px] border border-duty-rule px-[18px] py-[10px] text-[14px] font-semibold text-ink-meta"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGenerate}
            className="cursor-pointer rounded-[11px] bg-navy px-5 py-[10px] text-[14px] font-semibold text-cream"
          >
            Generate &amp; preview
          </button>
        </div>
      </div>
    </div>
  );
}
