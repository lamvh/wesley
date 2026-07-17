"use client";

import { getBuildings } from "@/lib/mock-data";
import { useBuilding } from "@/lib/building-context";
import { BuildingCard } from "./building-card";

const buildings = getBuildings();

// Admin multi-site screen: header + 2-col grid of building cards. Selecting a
// card (or its "View this site" button) sets the shared active building used
// across the portal (topbar switcher + Stock header).
export function BuildingsView() {
  const { buildingId, setBuildingId } = useBuilding();

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] font-medium">Buildings</h1>
          <p className="mt-[5px] text-[15px] text-ink-muted">
            Manage your care homes - wings, capacity and site managers
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream"
        >
          <span className="text-[18px] leading-none">+</span>Add building
        </button>
      </div>

      <div className="mt-[22px] grid grid-cols-2 gap-[18px] max-md:grid-cols-1">
        {buildings.map((b) => (
          <BuildingCard
            key={b.id}
            building={b}
            active={b.id === buildingId}
            onSelect={() => setBuildingId(b.id)}
          />
        ))}
      </div>
    </div>
  );
}
