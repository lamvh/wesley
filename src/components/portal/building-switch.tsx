"use client";

import { useBuilding } from "@/lib/building-context";
import { getBuildings } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Topbar segmented switcher between care homes (admin only). Shares the
// selected building with the Buildings screen + Stock header via context.
export function BuildingSwitch() {
  const { buildingId, setBuildingId } = useBuilding();
  const buildings = getBuildings();
  return (
    <div className="flex items-center rounded-[11px] border border-line-soft bg-toggle-track p-[3px] max-md:hidden">
      {buildings.map((b) => {
        const on = b.id === buildingId;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setBuildingId(b.id)}
            className={cn(
              "flex items-center gap-[9px] rounded-[9px] py-[6px] pl-[7px] pr-3 transition-colors",
              on ? "bg-cream-2 shadow-sm" : "bg-transparent",
            )}
          >
            <span
              style={{ backgroundColor: b.color }}
              className="flex size-6 items-center justify-center rounded-[7px] font-serif text-[13px] font-semibold text-white"
            >
              {b.initials}
            </span>
            <span className="text-[13.5px] font-semibold text-ink-soft">{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}
