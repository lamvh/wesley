import Link from "next/link";
import { PersonBadge } from "@/components/shared/person-badge";
import { careTier, careTierMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { Resident } from "@/types/domain";

// One resident tile in the directory grid. Care-tier badge is derived from the
// wing via the care-tier scale. Navigates to the resident profile route.
export function ResidentCard({ resident }: { resident: Resident }) {
  const tier = careTier(resident.wing);
  const badge = careTierMeta[tier];
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
          <div className="text-[13px] text-ink-meta">
            {resident.wing} · Room {resident.room}
          </div>
        </div>
      </div>
      <div className="mt-[15px] flex items-center justify-between">
        <span
          className={cn(
            "rounded-full px-[11px] py-[5px] text-[12.5px] font-semibold",
            badge.badge,
          )}
        >
          {tier}
        </span>
        <span className="text-[12.5px] text-ink-faint">{resident.diet}</span>
      </div>
    </Link>
  );
}
