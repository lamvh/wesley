import type { RosterDay, RosterGrid, RosterStaff, ShiftType } from "@/types/domain";

// Shift types keyed by id (matches the design's shiftDefs). Ordered for the legend/picker.
export const SHIFT_ORDER = ["ms", "m", "e", "a", "n", "tld", "tll"] as const;

const shiftDefs: Record<string, ShiftType> = {
  ms: { id: "ms", code: "M/Stock", label: "Morning + Stock", time: "6:45–17:15", color: "#8A6516", tint: "#FBEFC8", border: "#E7CE8A" },
  m: { id: "m", code: "M", label: "Morning", time: "6:45–15:15", color: "#87651A", tint: "#FCF4DC", border: "#EAD9A4" },
  e: { id: "e", code: "E", label: "Evening (split)", time: "8:30–18:00 + 18:00–21:00", color: "#A24E2A", tint: "#F7DDCC", border: "#E8AE88" },
  a: { id: "a", code: "A", label: "Afternoon", time: "14:45–22:15", color: "#9A4A70", tint: "#F7DFEA", border: "#E5B2CB" },
  n: { id: "n", code: "N", label: "Night", time: "23:45–8:15", color: "#3B4E74", tint: "#E3E8F5", border: "#B4C1DF" },
  tld: { id: "tld", code: "TL · Day", label: "Team Leader — day", time: "8:00–15:30", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
  tll: { id: "tll", code: "TL · Late", label: "Team Leader — late", time: "16:15–22:45", color: "#2C5A6E", tint: "#D8EAF0", border: "#9FC5D4" },
};

const rosterStaff: RosterStaff[] = [
  { name: "Hong Le", pos: "CT", initials: "HL", color: "#BE7350" },
  { name: "Duy Nguyen", pos: "CT", initials: "DN", color: "#6E875E" },
  { name: "Thanh Ngo", pos: "CT", initials: "TN", color: "#8a6ba3" },
  { name: "Tran Quynh Trang", pos: "CT", initials: "TT", color: "#c08a3e" },
  { name: "Candy Tian", pos: "CT", initials: "CT", color: "#9a7b4f" },
  { name: "LE Dinh Khue Lan", pos: "CT", initials: "KL", color: "#5b8f9a" },
  { name: "Vo Hoang Lam", pos: "CT", initials: "VL", color: "#b06a5a" },
  { name: "Tien Dat Cap", pos: "CT", initials: "DC", color: "#7e9b6a" },
  { name: "LE Anh Thang", pos: "CT", initials: "AT", color: "#6e879e" },
];

const rosterDays: RosterDay[] = [
  { dow: "Mon", date: "13" }, { dow: "Tue", date: "14" }, { dow: "Wed", date: "15" },
  { dow: "Thu", date: "16" }, { dow: "Fri", date: "17" }, { dow: "Sat", date: "18" }, { dow: "Sun", date: "19" },
];

export const ROSTER_WEEK_TITLE = "STAFF ROSTER · 13/07 – 19/07";

// Default assignments — one row per staff member, 7 day columns.
const defaultRows: (string | string[] | null)[][] = [
  ["ms", "e", "ms", null, "ms", null, "ms"],
  [["tld", "tll"], "tld", "tld", "e", ["tld", "tll"], null, "e"],
  ["e", "m", "e", "m", null, "m", null],
  [null, null, null, null, "e", "e", null],
  [null, "a", "a", null, "a", null, "a"],
  ["n", "n", null, null, "n", null, null],
  [null, "tll", null, "tld", null, ["tld", "tll"], "n"],
  [null, null, "n", "n", null, "n", null],
  [null, null, null, "a", null, "a", ["tld", "tll"]],
];

export function getShiftDefs(): Record<string, ShiftType> {
  return shiftDefs;
}

export function getShiftLegend(): ShiftType[] {
  return SHIFT_ORDER.map((id) => shiftDefs[id]);
}

export function getRosterStaff(): RosterStaff[] {
  return rosterStaff;
}

export function getRosterDays(): RosterDay[] {
  return rosterDays;
}

export function getDefaultRosterGrid(): RosterGrid {
  const grid: RosterGrid = {};
  defaultRows.forEach((row, ri) =>
    row.forEach((cell, ci) => {
      if (cell) grid[`${ri}-${ci}`] = Array.isArray(cell) ? [...cell] : [cell];
    }),
  );
  return grid;
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
