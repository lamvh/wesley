import type { RosterDay, RosterGrid, ShiftType } from "@/types/domain";
import { rosterCellKey } from "@/types/domain";

// Shift-type vocabulary keyed by id. Ordered for the legend/picker. These are
// the shift categories a roster is built from — reference data, not demo rows.
export const SHIFT_ORDER = [
  "m", "ms", "d", "mid", "e", "a", "la", "ev", "n", "nl", "tld", "tll", "k", "kl",
] as const;

const shiftDefs: Record<string, ShiftType> = {
  m: { id: "m", code: "M", label: "Morning", time: "6:45–15:15", color: "#87651A", tint: "#FCF4DC", border: "#EAD9A4" },
  ms: { id: "ms", code: "M/Stock", label: "Morning + Stock", time: "6:45–17:15", color: "#8A6516", tint: "#FBEFC8", border: "#E7CE8A" },
  d: { id: "d", code: "Day", label: "Day", time: "8:00–16:30", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  mid: { id: "mid", code: "Mid", label: "Mid", time: "11:30–20:00", color: "#3d6b74", tint: "#DEEAEC", border: "#9FC5D4" },
  e: { id: "e", code: "E", label: "Evening (split)", time: "8:30–18:00 + 18:00–21:00", color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  a: { id: "a", code: "A", label: "Afternoon", time: "14:45–22:15", color: "#9A4A70", tint: "#F7DFEA", border: "#E5B2CB" },
  la: { id: "la", code: "A/Late", label: "Afternoon (late)", time: "14:45–23:15", color: "#8A3F63", tint: "#F3DBE7", border: "#E0A9C4" },
  ev: { id: "ev", code: "Ev", label: "Evening", time: "16:00–21:00", color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  n: { id: "n", code: "N", label: "Night", time: "23:45–8:15", color: "#3B4E74", tint: "#E3E8F5", border: "#B4C1DF" },
  nl: { id: "nl", code: "N/Early", label: "Night (early)", time: "22:45–7:15", color: "#34456A", tint: "#DFE5F3", border: "#B4C1DF" },
  tld: { id: "tld", code: "TL · Day", label: "Team Leader — day", time: "8:00–15:30", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  tll: { id: "tll", code: "TL · Late", label: "Team Leader — late", time: "16:15–22:45", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  k: { id: "k", code: "Kitchen", label: "Kitchen", time: "7:00–18:00", color: "#6E5A2A", tint: "#F0E7CE", border: "#D8C48E" },
  kl: { id: "kl", code: "Kit·Late", label: "Kitchen (late)", time: "16:00–19:00", color: "#6E5A2A", tint: "#F0E7CE", border: "#D8C48E" },
};

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getShiftDefs(): Record<string, ShiftType> {
  return shiftDefs;
}

export function getShiftLegend(): ShiftType[] {
  return SHIFT_ORDER.map((id) => shiftDefs[id]);
}

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
