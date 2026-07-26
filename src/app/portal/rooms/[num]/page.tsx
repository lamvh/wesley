import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/portal/back-link";
import { PersonBadge } from "@/components/shared/person-badge";
import { RoomStatusCard } from "@/components/portal/rooms/room-status-card";
import { careTierMeta, roomStatusMeta } from "@/lib/design-meta";
import { getRoomByNumber, DEFAULT_BUILDING } from "@/lib/data/rooms";
import { getBuildingName } from "@/lib/data/buildings";
import { cn } from "@/lib/utils";

// Admin deep-view of a single room, from the real register.
//
// The wing / care-type header line and the supplies + housekeeping panels are
// gone: wings and care types were dropped project-wide, and the supplies and
// housekeeping copy were mock strings attached to every occupied room. Showing
// them against real rooms would present invented stock levels as fact.
export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ num: string }>;
  searchParams: Promise<{ home?: string }>;
}) {
  const [{ num }, { home }] = await Promise.all([params, searchParams]);
  // Both homes have a 3A, so the number alone does not identify a room. Room
  // cards link with ?home=; a link without it means the older Wesley-only URL.
  const room = await getRoomByNumber(num, home || DEFAULT_BUILDING);
  if (!room) notFound();
  const homeName = await getBuildingName(room.buildingId);

  const meta = roomStatusMeta[room.status];
  const tier = room.tier ? careTierMeta[room.tier] : null;

  return (
    <div className="mx-auto max-w-[1180px]">
      <BackLink href="/portal/rooms" label="All rooms" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-2xl border border-line bg-cream-2 px-[26px] py-[22px]">
        <span className={cn("absolute inset-y-0 left-0 w-[5px]", meta.dot)} aria-hidden />
        <div>
          <div className="font-serif text-[30px] font-semibold text-ink">
            Room {room.num}
          </div>
          <div className="text-[13.5px] text-ink-faint">{homeName}</div>
          {tier ? (
            <span className={cn("mt-1 inline-block rounded-full px-[10px] py-[3px] text-[12px] font-semibold", tier.badge)}>
              {room.tier}
            </span>
          ) : (
            <div className="text-[14px] text-ink-muted">Chưa đặt hạng phòng</div>
          )}
        </div>
        <span
          className={cn("rounded-full px-[15px] py-[7px] text-[13px] font-semibold", meta.badge)}
        >
          {room.status}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          {room.occupants.length > 0 ? (
            <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
              <div className="text-[12px] font-bold uppercase tracking-[0.4px] text-status-available">
                {room.occupants.length > 1 ? "Residents" : "Resident"}
              </div>
              {room.occupants.map((occupant) => (
                <div key={occupant.slug} className="mt-[14px] flex items-center gap-[14px]">
                  <PersonBadge
                    initials={occupant.initials}
                    color={occupant.color}
                    className="size-[54px] rounded-[16px] text-[18px]"
                    serif
                  />
                  <div className="min-w-0">
                    <Link
                      href={`/portal/residents/${occupant.slug}`}
                      className="font-serif text-[22px] font-semibold text-ink hover:text-navy"
                    >
                      {occupant.name}
                    </Link>
                    <div className="mt-[3px] flex flex-wrap gap-[6px]">
                      {[occupant.diet, occupant.mobility]
                        .filter(Boolean)
                        .map((chip) => (
                          <span
                            key={chip}
                            className="rounded-full bg-muted px-[10px] py-[3px] text-[12px] font-medium text-ink-muted"
                          >
                            {chip}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
              {room.note && (
                <p className="mt-[14px] text-[14px] leading-[1.6] text-ink-nav">{room.note}</p>
              )}
            </div>
          ) : (
            <RoomStatusCard note={room.note || `Phòng đang ${room.status}.`} />
          )}
        </div>
      </div>
    </div>
  );
}
