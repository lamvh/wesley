"use client";

import type { DutySheet } from "@/types/domain";
import { DutyRosterSheet } from "@/components/portal/roster/duty-roster-sheet";

interface DutyRosterPreviewProps {
  open: boolean;
  sheets: DutySheet[];
  title: string;
  onPrint: () => void;
  onClose: () => void;
}

// Full-screen print preview for the duty roster. The sticky toolbar is hidden
// on print (see globals.css `.duty-toolbar`); only the `.duty-sheets` stack is
// painted, one A4 page each. "Print / Save PDF" calls the browser print dialog.
//
// `duty-preview-overlay` is load-bearing for print: per CSS2.1 §9.3.1, a
// `position: fixed` box is repeated on every printed page - so without the
// globals.css `@media print` override that drops it back to `position:
// static`, this wrapper (and the `.duty-sheets` it positions) redraws the
// first sheet on top of every page, showing as duplicate/overlapping pages.
export function DutyRosterPreview({ open, sheets, title, onPrint, onClose }: DutyRosterPreviewProps) {
  if (!open) return null;

  return (
    <div className="duty-preview-overlay fixed inset-0 z-[400] overflow-auto bg-navy-deep/70">
      <div className="duty-toolbar sticky top-0 z-[2] flex items-center gap-3 bg-navy-deep px-[18px] py-[13px]">
        <span className="flex-1 text-[14px] font-semibold text-toggle-track">
          Duty roster · {title}
        </span>
        <button
          type="button"
          onClick={onPrint}
          className="cursor-pointer rounded-[10px] bg-cream px-[18px] py-[9px] text-[13.5px] font-semibold text-navy-deep"
        >
          Print / Save PDF
        </button>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-[10px] border border-duty-close px-4 py-[9px] text-[13.5px] font-semibold text-toggle-track"
        >
          Close
        </button>
      </div>

      <div className="duty-sheets">
        {sheets.map((sheet, i) => (
          <DutyRosterSheet key={`${sheet.dateLabel}-${i}`} sheet={sheet} />
        ))}
      </div>
    </div>
  );
}
