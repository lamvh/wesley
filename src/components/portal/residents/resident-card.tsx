import Link from "next/link";
import { PersonBadge } from "@/components/shared/person-badge";
import type { Resident } from "@/types/domain";

// One resident tile in the directory grid. Navigates to the resident profile
// route. The care-tier badge was retired from the design; the card shows the
// resident, their room and diet only.
export function ResidentCard({ resident }: { resident: Resident }) {
  return (
    <Link
      href={`/portal/residents/${resident.slug}`}
      className="block rounded-2xl border border-line bg-cream-2 p-[18px] transition-all hover:border-line-strong hover:shadow-[0_8px_20px_-12px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-center gap-[14px]">
        <PersonBadge
          initials={resident.avatar}
          color={resident.color}
          serif
          className="size-[52px] rounded-[14px] text-[20px]"
        />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold text-ink">{resident.name}</div>
          <div className="text-[13px] text-ink-meta">Room {resident.room}</div>
        </div>
      </div>
      <div className="mt-[15px] flex items-center justify-between">
        <span className="text-[12.5px] text-ink-faint">{resident.diet}</span>
      </div>
    </Link>
  );
}
