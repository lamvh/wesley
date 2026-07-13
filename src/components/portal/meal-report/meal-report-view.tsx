"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { portalIdentity } from "@/lib/portal-identity";
import { usePortalRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";
import {
  getDefaultMealLog,
  getMealReportResidents,
  MEAL_SLOTS,
  summariseMealLog,
} from "@/lib/mock-data";
import type { IntakeLevel, MealLog } from "@/types/domain";
import { MealReportRow } from "./meal-report-row";

type MealSlot = (typeof MEAL_SLOTS)[number];

export function MealReportView() {
  const residents = useMemo(() => getMealReportResidents(), []);
  const { role } = usePortalRole();
  const loggedBy = portalIdentity(role).name;

  const [log, setLog] = useState<MealLog>(getDefaultMealLog());

  // Set an intake level; picking the level that's already active clears it.
  function setIntake(idx: number, slot: MealSlot, level: IntakeLevel) {
    setLog((prev) => {
      const row = { ...(prev[idx] ?? {}) };
      row[slot] = row[slot] === level ? undefined : level;
      return { ...prev, [idx]: row };
    });
  }

  const summary = summariseMealLog(residents.length, log);

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[1.6px] text-bronze-text">
            Daily record
          </div>
          <h1 className="mt-[6px] font-serif text-[34px] font-medium tracking-[-0.3px] text-ink">
            Meal report
          </h1>
          <p className="mt-[6px] text-[15.5px] text-ink-muted">
            Log every resident&rsquo;s intake for each meal today — flag anyone eating poorly.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right leading-[1.15]">
            <div className="text-[13.5px] font-semibold text-ink-soft">Saturday, 12 July</div>
            <div className="text-[12px] text-ink-faint">Logged by {loggedBy}</div>
          </div>
          <Button className="h-auto rounded-[11px] bg-navy px-[18px] py-3 text-[14px] font-semibold text-cream hover:bg-navy/90">
            Submit report
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[16px] border border-line bg-cream-2 px-5 py-[18px]">
          <div className="text-[13px] font-semibold text-ink-meta">Entries logged</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-[33px] leading-none text-ink">{summary.logged}</span>
            <span className="text-[12.5px] font-semibold text-ink-faint">/ {summary.total}</span>
          </div>
          <div className="mt-[5px] text-[12.5px] text-ink-faint">{summary.pct}% complete</div>
        </div>
        <SummaryTile label="Ate well" value={summary.well} valueClass="text-sage" sub="All or most eaten" />
        <SummaryTile label="Poor intake" value={summary.low} valueClass="text-gold-text" sub="Some or less — monitor" />
        <SummaryTile label="Refused" value={summary.refused} valueClass="text-rust" sub="Escalate to RN" />
      </div>

      <div className="mt-4 overflow-x-auto rounded-[16px] border border-line bg-cream-2">
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[1.7fr_1.1fr_1.1fr_1.1fr_1.3fr] gap-[14px] border-b border-line-divider px-[22px] py-[14px] text-[12px] font-bold uppercase tracking-[0.4px] text-ink-faint">
            <div>Resident</div>
            <div>Breakfast</div>
            <div>Lunch</div>
            <div>Dinner</div>
            <div>Notes</div>
          </div>
          {residents.map((resident) => (
            <MealReportRow
              key={resident.idx}
              resident={resident}
              log={log[resident.idx]}
              onIntake={(slot, level) => setIntake(resident.idx, slot, level)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  valueClass,
  sub,
}: {
  label: string;
  value: number;
  valueClass: string;
  sub: string;
}) {
  return (
    <div className="rounded-[16px] border border-line bg-cream-2 px-5 py-[18px]">
      <div className="text-[13px] font-semibold text-ink-meta">{label}</div>
      <div className={cn("mt-2 font-serif text-[33px] leading-none", valueClass)}>{value}</div>
      <div className="mt-[5px] text-[12.5px] text-ink-faint">{sub}</div>
    </div>
  );
}
