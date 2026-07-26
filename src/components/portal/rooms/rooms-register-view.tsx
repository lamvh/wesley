"use client";

import { useState } from "react";
import { KpiCard } from "@/components/shared/kpi-card";
import { RoomCard } from "./room-card";
import { cn } from "@/lib/utils";
import type { RoomRecord } from "@/lib/data/rooms";
import type { Kpi } from "@/types/domain";

interface BuildingTab {
  id: string;
  name: string;
}

// The room register split by home, mirroring the residents directory. The KPI
// tiles follow the active tab rather than summing both homes - "occupied of
// total" is only meaningful for one building at a time.
export function RoomsRegisterView({
  rooms,
  buildings,
}: {
  rooms: RoomRecord[];
  buildings: BuildingTab[];
}) {
  const [activeId, setActiveId] = useState(buildings[0]?.id ?? "");
  const shown = rooms.filter((r) => r.buildingId === activeId);

  const occupied = shown.filter((r) => r.occupants.length > 0).length;
  const available = shown.filter((r) => r.status === "Available").length;
  const maintenance = shown.filter((r) => r.status === "Maintenance").length;

  // Counted from the register rather than hard-coded, so the tiles can't drift
  // from the grid below them.
  const kpis: Kpi[] = [
    { label: "Occupied", value: String(occupied), sub: `of ${shown.length} rooms`, valueTone: "ink" },
    { label: "Available now", value: String(available), sub: "Ready for admission", valueTone: "available" },
    { label: "Maintenance", value: String(maintenance), sub: "Out of service", valueTone: "rust" },
    { label: "Total rooms", value: String(shown.length), sub: "In the register", valueTone: "navy" },
  ];

  return (
    <>
      <div className="mt-[22px] flex flex-wrap gap-1.5 rounded-full border border-field bg-cream-3 p-1 sm:w-fit">
        {buildings.map((b) => {
          const count = rooms.filter((r) => r.buildingId === b.id).length;
          return (
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="mt-[22px] rounded-[16px] border border-dashed border-line-strong bg-cream-2 px-6 py-[40px] text-center text-[14px] text-ink-muted">
          Chưa có phòng nào trong sổ đăng ký của toà nhà này.
        </div>
      ) : (
        <>
          <div className="mt-[18px] grid grid-cols-4 gap-4 max-md:grid-cols-2">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
          <div className="mt-[22px] grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {shown.map((room) => (
              <RoomCard key={`${room.buildingId}-${room.num}`} room={room} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
