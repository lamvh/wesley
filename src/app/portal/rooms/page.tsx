import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { RoomsRegisterView } from "@/components/portal/rooms/rooms-register-view";
import { getRoomRecords } from "@/lib/data/rooms";
import { listBuildings } from "@/lib/data/buildings";

// Admin overview of every room in both homes' real registers, one tab per home
// and a flat grid inside each. Rooms used to be grouped by wing; wings were a
// design-source invention the real data never carried, so the grid now follows
// the register's own sort order (3A after 3, the 125-134 block last).
export default async function RoomsPage() {
  const [rooms, buildings] = await Promise.all([getRoomRecords(), listBuildings()]);
  const tabs = [...buildings].sort((a, b) => (a.id === "wesley" ? -1 : b.id === "wesley" ? 1 : 0));

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Rooms"
        sub="Every room ties together its resident, supplies and daily programme"
      />
      <RoomsRegisterView rooms={rooms} buildings={tabs} />
    </div>
  );
}
