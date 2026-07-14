"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ShiftLegend } from "@/components/portal/roster/shift-legend";
import { RosterGrid } from "@/components/portal/roster/roster-grid";
import { LeaveRequestRow } from "@/components/portal/roster/leave-request-row";
import { DutyRosterModal } from "@/components/portal/roster/duty-roster-modal";
import { DutyRosterPreview } from "@/components/portal/roster/duty-roster-preview";
import {
  DUTY_DEFAULTS,
  ROSTER_WEEK_TITLE,
  buildDutySheets,
  dailyTotals,
  getDefaultRosterGrid,
  getDutyDayOptions,
  getDutySheetTitle,
  getDutyStaffOptions,
  getLeaveRequests,
  getRosterDays,
  getRosterStaff,
  getShiftDefs,
  getShiftLegend,
  totalShifts,
} from "@/lib/mock-data";
import type { DutyForm, RosterGrid as RosterGridState } from "@/types/domain";

// Weekly roster scheduler: staff × 7-day grid with an assignable shift picker
// per cell, plus the pending leave/requests list. The header can export a
// print-ready duty roster (modal → full-screen A4 preview). Toolbar week-nav
// and leave actions are inert this phase.
export function RosterView({ initialDutyPreview = false }: { initialDutyPreview?: boolean }) {
  const [grid, setGrid] = useState<RosterGridState>(() => getDefaultRosterGrid());
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [dutyOpen, setDutyOpen] = useState(false);
  const [dutyPreview, setDutyPreview] = useState(initialDutyPreview);
  const [dutyForm, setDutyForm] = useState<DutyForm>(DUTY_DEFAULTS);

  const staff = getRosterStaff();
  const days = getRosterDays();
  const defs = getShiftDefs();
  const legend = getShiftLegend();
  const leaveRequests = getLeaveRequests();
  const dayOptions = getDutyDayOptions();
  const staffOptions = getDutyStaffOptions();

  const totals = dailyTotals(staff.length, days.length, grid);
  const total = totalShifts(grid);

  const dutySheets = useMemo(() => buildDutySheets(grid, dutyForm), [grid, dutyForm]);
  const dutySheetTitle = getDutySheetTitle(dutyForm);

  const openRosterCell = (key: string) =>
    setOpenCell((prev) => (prev === key ? null : key));

  const toggleShift = (key: string, shiftId: string) => {
    setGrid((prev) => {
      const next = { ...prev };
      const ids = [...(next[key] ?? [])];
      const i = ids.indexOf(shiftId);
      if (i >= 0) ids.splice(i, 1);
      else ids.push(shiftId);
      if (ids.length === 0) delete next[key];
      else next[key] = ids;
      return next;
    });
  };

  const clearCell = (key: string) => {
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOpenCell(null);
  };

  const patchDuty = (patch: Partial<DutyForm>) =>
    setDutyForm((prev) => ({ ...prev, ...patch }));

  const printDuty = () => {
    if (typeof window !== "undefined") window.print();
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-medium text-ink">
            Roster & shifts
          </h1>
          <p className="mt-[5px] text-[15px] text-ink-muted">
            {ROSTER_WEEK_TITLE} · {staff.length} staff · {total} shifts assigned
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="flex overflow-hidden rounded-[11px] border border-line-soft">
            <button
              type="button"
              aria-label="Previous week"
              className="border-r border-line-soft bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next week"
              className="bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav"
            >
              ›
            </button>
          </div>
          <Button
            variant="outline"
            className="h-auto rounded-[11px] border-line-soft bg-cream-2 px-[15px] py-[9px] text-[14px] font-semibold text-ink-nav hover:bg-cream"
          >
            Copy last week
          </Button>
          <Button
            variant="outline"
            onClick={() => setDutyOpen(true)}
            className="h-auto rounded-[11px] border-none bg-navy-tint px-[15px] py-[9px] text-[14px] font-semibold text-navy hover:bg-navy-tint/80"
          >
            Export duty roster
          </Button>
          <Button
            onClick={() => setPublished(true)}
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            {published ? "Published ✓" : "Publish roster"}
          </Button>
        </div>
      </div>

      <ShiftLegend legend={legend} />

      <RosterGrid
        staff={staff}
        days={days}
        grid={grid}
        defs={defs}
        pickerDefs={legend}
        totals={totals}
        openCell={openCell}
        onOpen={openRosterCell}
        onClose={() => setOpenCell(null)}
        onToggle={toggleShift}
        onClear={clearCell}
      />

      <section className="mt-4 rounded-[16px] border border-line bg-cream-2 p-[22px]">
        <h2 className="font-serif text-[20px] font-semibold text-ink">
          Leave & requests
        </h2>
        <div className="mt-3 flex flex-col gap-[2px]">
          {leaveRequests.map((request) => (
            <LeaveRequestRow key={request.name} request={request} />
          ))}
        </div>
      </section>

      <DutyRosterModal
        open={dutyOpen}
        form={dutyForm}
        dayOptions={dayOptions}
        staffOptions={staffOptions}
        onScope={(scope) => patchDuty({ scope })}
        onDay={(day) => patchDuty({ day })}
        onOnCall={(onCall) => patchDuty({ onCall })}
        onChef={(chef) => patchDuty({ chef })}
        onCancel={() => setDutyOpen(false)}
        onGenerate={() => {
          setDutyOpen(false);
          setDutyPreview(true);
        }}
      />

      <DutyRosterPreview
        open={dutyPreview}
        sheets={dutySheets}
        title={dutySheetTitle}
        onPrint={printDuty}
        onClose={() => setDutyPreview(false)}
      />
    </div>
  );
}
