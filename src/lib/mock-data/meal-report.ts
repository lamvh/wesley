import type { MealLog, MealReportResident } from "@/types/domain";
import { getResidents } from "./residents";

/** Residents to log intake for today, in table order. */
export function getMealReportResidents(): MealReportResident[] {
  return getResidents().map((r, idx) => ({
    idx,
    name: r.pref || r.name,
    room: r.room,
    initials: r.avatar,
    color: r.color,
    diet: r.diet,
  }));
}

/** Seed intake - a few residents already logged, matching the design. */
export function getDefaultMealLog(): MealLog {
  return {
    0: { breakfast: "all", lunch: "most" },
    1: { breakfast: "all", lunch: "all" },
    2: { breakfast: "some", lunch: "refused" },
    4: { breakfast: "most" },
    6: { breakfast: "all" },
  };
}

export const MEAL_SLOTS = ["breakfast", "lunch", "dinner"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export interface MealSummary {
  logged: number;
  total: number;
  well: number;
  low: number;
  refused: number;
  pct: number;
}

/** Roll up a meal log into the 4 summary tiles. */
export function summariseMealLog(residentCount: number, log: MealLog): MealSummary {
  let logged = 0, well = 0, low = 0, refused = 0;
  const total = residentCount * 3;
  for (let i = 0; i < residentCount; i++) {
    const row = log[i] ?? {};
    for (const slot of MEAL_SLOTS) {
      const v = row[slot];
      if (!v) continue;
      logged++;
      if (v === "all" || v === "most") well++;
      if (v === "some" || v === "refused") low++;
      if (v === "refused") refused++;
    }
  }
  return { logged, total, well, low, refused, pct: total ? Math.round((logged / total) * 100) : 0 };
}
