import { PersonBadge } from "@/components/shared/person-badge";
import type { Room, RoomResident } from "@/types/domain";

// Occupied-room resident summary: avatar, name, care line, diet + mobility
// chips and the room note.
export function RoomResidentCard({
  resident,
  careLine,
  note,
}: {
  resident: RoomResident;
  careLine: Room["careType"];
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <div className="text-[12px] font-bold uppercase tracking-[0.4px] text-status-available">
        Resident
      </div>
      <div className="mt-[14px] flex items-center gap-[14px]">
        <PersonBadge
          initials={resident.initials}
          color={resident.color}
          serif
          className="size-[54px] rounded-[15px] text-[21px]"
        />
        <div>
          <div className="text-[18px] font-semibold text-ink">{resident.name}</div>
          <div className="text-[13px] text-ink-meta">{careLine}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-sage-tint px-3 py-1.5 text-[13px] font-semibold text-sage">
          {resident.diet}
        </span>
        <span className="rounded-full bg-navy-tint px-3 py-1.5 text-[13px] font-semibold text-status-available">
          {resident.mobility}
        </span>
      </div>
      <p className="mt-[14px] text-[14px] leading-[1.6] text-ink-nav">{note}</p>
    </div>
  );
}
