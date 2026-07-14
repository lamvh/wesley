"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShiftLegend } from "@/components/portal/roster/shift-legend";
import { RosterGrid } from "@/components/portal/roster/roster-grid";
import {
  dailyTotals,
  rosterWeekTitle,
  shiftWeek,
  totalShifts,
} from "@/lib/mock-data";
import { clearRosterCell, toggleRosterShift } from "@/lib/actions/roster";
import { groupStaffForRoster } from "@/lib/roster-grouping";
import type {
  RoleDef,
  RoleGroup,
  RosterDay,
  RosterGrid as RosterGridState,
  ShiftType,
  StaffRecord,
} from "@/types/domain";

interface RosterViewProps {
  staff: StaffRecord[];
  days: RosterDay[];
  initialGrid: RosterGridState;
  shiftTypes: ShiftType[];
  roles: RoleDef[];
  groups: RoleGroup[];
  weekStartISO: string;
}

// Weekly roster scheduler: real staff × 7-day grid with an assignable shift
// picker per cell. Cell keys are `${staffId}::${dateISO}`. Assignments auto-save
// to Supabase on every toggle (optimistic local update + server action), and the
// visible week is navigated via ?week= so persisted data reloads per week.
export function RosterView({
  staff,
  days,
  initialGrid,
  shiftTypes,
  roles,
  groups,
  weekStartISO,
}: RosterViewProps) {
  const router = useRouter();
  const [grid, setGrid] = useState<RosterGridState>(initialGrid);
  const [openCell, setOpenCell] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const [, startTransition] = useTransition();

  // Legend/picker vocabulary is the real shift templates. `defs` indexes them
  // by id for the grid cells; `legend` is the ordered list for the legend bar
  // and the per-cell picker.
  const legend = shiftTypes;
  const defs = Object.fromEntries(shiftTypes.map((s) => [s.id, s]));

  // Staff are banded into their role group (Nurses & HCAs → Care Takers → …)
  // so the roster reads by role, not a flat alphabetical list.
  const bands = groupStaffForRoster(staff, roles, groups);

  const totals = dailyTotals(
    staff.map((s) => s.id),
    days,
    grid,
  );
  const total = totalShifts(grid);
  const weekTitle = rosterWeekTitle(days);

  const openRosterCell = (key: string) =>
    setOpenCell((prev) => (prev === key ? null : key));

  const gotoWeek = (delta: number) =>
    router.push(`/portal/roster?week=${shiftWeek(weekStartISO, delta)}`);

  // key is `${staffId}::${dateISO}` — split back out for the server action.
  const cellParts = (key: string) => {
    const i = key.indexOf("::");
    return { staffId: key.slice(0, i), dateISO: key.slice(i + 2) };
  };

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
    const { staffId, dateISO } = cellParts(key);
    startTransition(() => {
      void toggleRosterShift(staffId, dateISO, shiftId);
    });
  };

  const clearCell = (key: string) => {
    setGrid((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setOpenCell(null);
    const { staffId, dateISO } = cellParts(key);
    startTransition(() => {
      void clearRosterCell(staffId, dateISO);
    });
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-medium text-ink">
            Roster & shifts
          </h1>
          <p className="mt-[5px] text-[15px] text-ink-muted">
            {weekTitle} · {staff.length} staff · {total} shifts assigned
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <div className="flex overflow-hidden rounded-[11px] border border-line-soft">
            <button
              type="button"
              aria-label="Previous week"
              onClick={() => gotoWeek(-1)}
              className="border-r border-line-soft bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav hover:bg-cream"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next week"
              onClick={() => gotoWeek(1)}
              className="bg-cream-2 px-[13px] py-2 text-[16px] font-semibold text-ink-nav hover:bg-cream"
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
            onClick={() => setPublished(true)}
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            {published ? "Published ✓" : "Publish roster"}
          </Button>
        </div>
      </div>

      <ShiftLegend legend={legend} />

      {staff.length === 0 ? (
        <div className="mt-4 rounded-[16px] border border-dashed border-line-strong bg-cream-2 px-6 py-[40px] text-center text-[14px] text-ink-muted">
          No staff yet — add team members in Staff to roster them here.
        </div>
      ) : (
        <RosterGrid
          bands={bands}
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
      )}
    </div>
  );
}
