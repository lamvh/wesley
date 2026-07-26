"use client";

import { useState } from "react";
import { ResidentCard } from "./resident-card";
import { cn } from "@/lib/utils";
import type { Resident } from "@/types/domain";

interface BuildingTab {
  id: string;
  name: string;
}

// The directory split by home: one tab per building, each showing only the
// residents who live there. Room numbers repeat across the two homes (both have
// a 3A), so a single merged list would read as one register when it is two.
//
// Filtering is client-side over the full set the page already loaded - the tab
// is a view of data in hand, not another round trip.
export function ResidentsDirectory({
  residents,
  buildings,
}: {
  residents: Resident[];
  buildings: BuildingTab[];
}) {
  const [activeId, setActiveId] = useState(buildings[0]?.id ?? "");
  const shown = residents.filter((r) => r.buildingId === activeId);
  const countFor = (id: string) => residents.filter((r) => r.buildingId === id).length;

  return (
    <>
      <div className="mt-[22px] flex flex-wrap gap-1.5 rounded-full border border-field bg-cream-3 p-1 sm:w-fit">
        {buildings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveId(b.id)}
            aria-pressed={b.id === activeId}
            className={cn(
              "rounded-full px-[15px] py-1.5 text-[13px] font-semibold",
              b.id === activeId ? "bg-navy text-cream" : "text-ink-muted",
            )}
          >
            {b.name}
            <span className={cn("ml-2 text-[12px]", b.id === activeId ? "text-cream/70" : "text-ink-faint")}>
              {countFor(b.id)}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="mt-[22px] rounded-[16px] border border-line bg-cream-2 px-5 py-6 text-[14px] text-ink-faint">
          No residents recorded in this home yet.
        </p>
      ) : (
        <div className="mt-[18px] grid grid-cols-1 gap-[14px] sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((resident) => (
            <ResidentCard key={`${resident.buildingId}-${resident.slug}`} resident={resident} />
          ))}
        </div>
      )}
    </>
  );
}
