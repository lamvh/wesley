"use client";

import { formatHours, staffWeekHours } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import type { RosterBand } from "@/lib/roster-grouping";
import type { RosterDay, RosterGrid } from "@/types/domain";

// The roster's trailing "Hours this week" column: one cell per staff row, a
// subtotal on each band's footer, and the week's grand total.
//
// Every figure is derived from the grid the scheduler is holding, so the
// numbers move with each assignment rather than lagging until a save/refresh.
// Extracted from roster-grid.tsx to keep that file near the size guideline.

type PaidHoursOf = (shiftId: string) => number;

/** Shown when a staffer's shifts include a template with no paid_hours set -
 *  the hours figure is then an undercount, and saying so beats a quiet 0. */
function unsetHint(shifts: number, hours: number): string {
  return shifts > 0 && hours === 0
    ? " · none of these shifts have paid hours set"
    : "";
}

export function StaffHoursCell({
  staffId,
  days,
  grid,
  paidHoursOf,
  name,
}: {
  staffId: string;
  days: RosterDay[];
  grid: RosterGrid;
  paidHoursOf: PaidHoursOf;
  name: string;
}) {
  const { hours, shifts } = staffWeekHours(staffId, days, grid, paidHoursOf);
  const none = shifts === 0;
  return (
    <td
      title={`${name}: ${formatHours(hours)} giờ trong ${shifts} ca tuần này${unsetHint(shifts, hours)}`}
      className="border-l border-line-divider px-1 py-2 text-center align-middle tabular-nums"
    >
      <div className={cn("font-serif text-[17px] leading-none", none ? "text-ink-faint" : "text-ink")}>
        {formatHours(hours)}
      </div>
      <div className="mt-[3px] text-[10.5px] text-ink-faint">
        {none ? "no shifts" : `${shifts} ${shifts === 1 ? "shift" : "shifts"}`}
      </div>
    </td>
  );
}

export function BandHoursCell({
  band,
  days,
  grid,
  paidHoursOf,
}: {
  band: RosterBand;
  days: RosterDay[];
  grid: RosterGrid;
  paidHoursOf: PaidHoursOf;
}) {
  const total = band.staff.reduce(
    (acc, st) => acc + staffWeekHours(st.id, days, grid, paidHoursOf).hours,
    0,
  );
  return (
    <td
      title={`${band.label}: ${formatHours(total)} giờ tuần này`}
      className="border-l border-line-divider px-1 py-[6px] text-center text-[12px] font-bold tabular-nums"
      style={{ color: band.color }}
    >
      {formatHours(total)}
    </td>
  );
}

export function WeekHoursCell({
  bands,
  days,
  grid,
  paidHoursOf,
}: {
  bands: RosterBand[];
  days: RosterDay[];
  grid: RosterGrid;
  paidHoursOf: PaidHoursOf;
}) {
  const total = bands.reduce(
    (acc, b) =>
      acc + b.staff.reduce((n, st) => n + staffWeekHours(st.id, days, grid, paidHoursOf).hours, 0),
    0,
  );
  return (
    <td
      title={`Tổng giờ công cả tuần: ${formatHours(total)}`}
      className="border-l border-line-divider text-center font-serif text-[19px] text-ink tabular-nums"
    >
      {formatHours(total)}
    </td>
  );
}
