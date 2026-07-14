import type { RosterDay, RosterGrid } from "@/types/domain";
import { rosterCellKey } from "@/types/domain";

// Roster date/week helpers. The shift-type vocabulary (legend/picker) is real
// data — see getRosterShiftTypes in @/lib/data/roster.

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** YYYY-MM-DD in local time (avoids the UTC shift of Date.toISOString). */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string as a local-midnight Date (not UTC). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Monday that starts the week containing `d`. */
export function weekStartOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0 Sun .. 6 Sat
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  return x;
}

/** Shift a week-start ISO date by ±N weeks, returning the new ISO date. */
export function shiftWeek(weekStartISO: string, deltaWeeks: number): string {
  const d = parseISODate(weekStartISO);
  d.setDate(d.getDate() + deltaWeeks * 7);
  return toISODate(d);
}

/** The 7 Mon–Sun columns of the week starting at `weekStart`. */
export function getRosterDays(weekStart: Date): RosterDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
    return { dow: DOW[d.getDay()], date: String(d.getDate()), month: MON[d.getMonth()], iso: toISODate(d) };
  });
}

/** e.g. "STAFF ROSTER · 13/07 – 19/07" for the given week. */
export function rosterWeekTitle(days: RosterDay[]): string {
  const fmt = (day: RosterDay) => {
    const d = parseISODate(day.iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  return `STAFF ROSTER · ${fmt(days[0])} – ${fmt(days[6])}`;
}

/** staff-on-duty count per day column (one per day the staffer has ≥1 shift). */
export function dailyTotals(staffIds: string[], days: RosterDay[], grid: RosterGrid): number[] {
  return days.map((d) =>
    staffIds.reduce((n, id) => n + ((grid[rosterCellKey(id, d.iso)] ?? []).length ? 1 : 0), 0),
  );
}

export function totalShifts(grid: RosterGrid): number {
  return Object.values(grid).reduce((acc, ids) => acc + ids.length, 0);
}
