"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShiftLegend } from "@/components/portal/roster/shift-legend";
import { RosterGrid } from "@/components/portal/roster/roster-grid";
import { LeaveRequestRow } from "@/components/portal/roster/leave-request-row";
import {
  ROSTER_WEEK_TITLE,
  dailyTotals,
  getDefaultRosterGrid,
  getLeaveRequests,
  getRosterDays,
  getRosterStaff,
  getShiftDefs,
  getShiftLegend,
  totalShifts,
} from "@/lib/mock-data";
import type { RosterGrid as RosterGridState } from "@/types/domain";

// Weekly roster scheduler: staff × 7-day grid with an assignable shift picker
// per cell, plus the pending leave/requests list. Toolbar + leave actions are
// inert this phase.
export function RosterView() {
  const [grid, setGrid] = useState<RosterGridState>(() => getDefaultRosterGrid());
  const [openCell, setOpenCell] = useState<string | null>(null);

  const staff = getRosterStaff();
  const days = getRosterDays();
  const defs = getShiftDefs();
  const legend = getShiftLegend();
  const leaveRequests = getLeaveRequests();

  const totals = dailyTotals(staff.length, days.length, grid);
  const total = totalShifts(grid);

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
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            Publish roster
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
    </div>
  );
}
