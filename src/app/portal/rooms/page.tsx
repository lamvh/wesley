import { KpiCard } from "@/components/shared/kpi-card";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { RoomCard } from "@/components/portal/rooms/room-card";
import { getRoomRecords } from "@/lib/data/rooms";
import type { Kpi } from "@/types/domain";

// Admin overview of every room in the building's real register, as one flat
// grid. Rooms used to be grouped by wing; wings were a design-source invention
// the real data never carried, so the grid now follows the register's own sort
// order (3A after 3, the 125-134 block last).
export default async function RoomsPage() {
  const rooms = await getRoomRecords();

  const occupied = rooms.filter((r) => r.occupant).length;
  const available = rooms.filter((r) => r.status === "Available").length;
  const maintenance = rooms.filter((r) => r.status === "Maintenance").length;

  // Counted from the register rather than hard-coded, so the tiles can't drift
  // from the grid below them.
  const kpis: Kpi[] = [
    { label: "Occupied", value: String(occupied), sub: `of ${rooms.length} rooms`, valueTone: "ink" },
    { label: "Available now", value: String(available), sub: "Ready for admission", valueTone: "available" },
    { label: "Maintenance", value: String(maintenance), sub: "Out of service", valueTone: "rust" },
    { label: "Total rooms", value: String(rooms.length), sub: "In the register", valueTone: "navy" },
  ];

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Rooms"
        sub="Every room ties together its resident, supplies and daily programme"
      />

      {rooms.length === 0 ? (
        <div className="mt-[22px] rounded-[16px] border border-dashed border-line-strong bg-cream-2 px-6 py-[40px] text-center text-[14px] text-ink-muted">
          Chưa có phòng nào trong sổ đăng ký.
        </div>
      ) : (
        <>
          <div className="mt-[22px] grid grid-cols-4 gap-4 max-md:grid-cols-2">
            {kpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
          <div className="mt-[22px] grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {rooms.map((room) => (
              <RoomCard key={room.num} room={room} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
