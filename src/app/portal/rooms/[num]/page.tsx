import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { ActivityList } from "@/components/portal/rooms/activity-list";
import { RoomResidentCard } from "@/components/portal/rooms/room-resident-card";
import { RoomStatusCard } from "@/components/portal/rooms/room-status-card";
import { SupplyRow } from "@/components/portal/rooms/supply-row";
import { roomStatusMeta } from "@/lib/design-meta";
import { getRoomByNum } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Admin deep-view of a single room. Occupied → resident card + activities;
// vacant/maintenance → status card. Right column: supplies + housekeeping.
export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ num: string }>;
}) {
  const { num } = await params;
  const room = getRoomByNum(num);
  if (!room) notFound();

  const meta = roomStatusMeta[room.status];
  const occupied = !!room.resident;

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href="/portal/rooms" label="All rooms" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-line bg-cream-2 px-[26px] py-[22px]">
        <span className={cn("absolute inset-y-0 left-0 w-[5px]", meta.dot)} aria-hidden />
        <div>
          <div className="font-serif text-[30px] font-semibold text-ink">
            {room.wing} · Room {room.num}
          </div>
          <div className="text-[14px] text-ink-muted">{room.careType}</div>
        </div>
        <span
          className={cn(
            "rounded-full px-[15px] py-[7px] text-[13px] font-semibold",
            meta.badge,
          )}
        >
          {room.status}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          {occupied ? (
            <>
              <RoomResidentCard
                resident={room.resident!}
                careLine={room.careType}
                note={room.note}
              />
              <ActivityList activities={room.activities} />
            </>
          ) : (
            <RoomStatusCard note={room.note} />
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[19px] font-semibold text-ink">
                Room supplies
              </h3>
              <Link
                href="/portal/stock"
                className="text-[13px] font-semibold text-bronze-text"
              >
                Stock
              </Link>
            </div>
            {occupied ? (
              <div className="mt-2 flex flex-col">
                {room.supplies.map((item) => (
                  <SupplyRow key={item.name} item={item} />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[13.5px] text-ink-meta">
                No supplies allocated while the room is {room.status}.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
            <h3 className="font-serif text-[19px] font-semibold text-ink">
              Housekeeping
            </h3>
            <p className="mt-[10px] text-[13.5px] leading-[1.55] text-ink-nav">
              {room.house}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
