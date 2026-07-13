import { cn } from "@/lib/utils";
import { deltaToneClass, valueToneClass } from "@/lib/design-meta";
import type { Kpi } from "@/types/domain";

// Shared KPI tile used on dashboard, rooms, stock, incidents.
export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="rounded-2xl border border-line bg-card px-5 py-[18px]">
      <div className="text-[13px] font-semibold text-ink-meta">{kpi.label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div
          className={cn(
            "font-serif text-[31px] leading-none",
            kpi.valueTone ? valueToneClass[kpi.valueTone] : "text-ink",
          )}
        >
          {kpi.value}
        </div>
        {kpi.delta && (
          <div
            className={cn(
              "text-[12.5px] font-semibold",
              kpi.deltaTone ? deltaToneClass[kpi.deltaTone] : "text-navy",
            )}
          >
            {kpi.delta}
          </div>
        )}
      </div>
      <div className="mt-[5px] text-[12.5px] text-ink-faint">{kpi.sub}</div>
    </div>
  );
}
