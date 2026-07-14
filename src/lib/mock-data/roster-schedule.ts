import type { RosterDay, RosterGrid, ShiftType } from "@/types/domain";

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

const rosterDays: RosterDay[] = [
  { dow: "Mon", date: "13" }, { dow: "Tue", date: "14" }, { dow: "Wed", date: "15" },
  { dow: "Thu", date: "16" }, { dow: "Fri", date: "17" }, { dow: "Sat", date: "18" }, { dow: "Sun", date: "19" },
];

export const ROSTER_WEEK_TITLE = "STAFF ROSTER · 13/07 – 19/07";

export function getShiftDefs(): Record<string, ShiftType> {
  return shiftDefs;
}

export function getShiftLegend(): ShiftType[] {
  return SHIFT_ORDER.map((id) => shiftDefs[id]);
}

export function getRosterDays(): RosterDay[] {
  return rosterDays;
}

/** staff-on-duty count per day column. */
export function dailyTotals(staffCount: number, days: number, grid: RosterGrid): number[] {
  return Array.from({ length: days }, (_, ci) => {
    let n = 0;
    for (let ri = 0; ri < staffCount; ri++) if ((grid[`${ri}-${ci}`] ?? []).length) n++;
    return n;
  });
}

export function totalShifts(grid: RosterGrid): number {
  return Object.values(grid).reduce((acc, ids) => acc + ids.length, 0);
}
