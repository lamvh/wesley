import { PersonBadge } from "@/components/shared/person-badge";
import { StatTile } from "./stat-tile";
import { CareFlag } from "./care-flag";
import { careTier, careTierMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { Resident } from "@/types/domain";

// Full resident profile card: gradient banner (per-record colour → navy),
// overlapping avatar, identity + care-tier badge, 4 stat tiles, About + Care
// flags. The banner start colour is data-driven (the sanctioned inline-colour
// exception, like PersonBadge); the navy end reads the token via CSS var.
export function ResidentProfileHeader({ resident }: { resident: Resident }) {
  const tier = careTier(resident.wing);
  const badge = careTierMeta[tier];
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-cream-2">
      <div
        className="h-24"
        style={{
          backgroundImage: `linear-gradient(90deg, ${resident.color}, var(--color-navy))`,
        }}
        aria-hidden
      />
      <div className="-mt-[42px] px-7 pb-[26px]">
        <div className="flex items-end gap-[18px]">
          <PersonBadge
            initials={resident.avatar}
            color={resident.color}
            serif
            className="size-[88px] rounded-[20px] border-4 border-cream-2 text-[34px]"
          />
          <div className="flex-1 pb-1.5">
            <h2 className="font-serif text-[29px] font-semibold text-ink">
              {resident.name}
            </h2>
            <div className="text-[14.5px] text-ink-muted">
              Prefers &ldquo;{resident.pref}&rdquo; · {resident.wing} · Room{" "}
              {resident.room}
            </div>
          </div>
          <span
            className={cn(
              "rounded-full px-[14px] py-[7px] text-[13px] font-semibold",
              badge.badge,
            )}
          >
            {tier}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-[14px] md:grid-cols-4">
          <StatTile label="Age" value={String(resident.age)} emphasis />
          <StatTile label="Mobility" value={resident.mobility} />
          <StatTile label="Diet" value={resident.diet} />
          <StatTile label="GP" value={resident.gp} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line-soft bg-cream p-[18px]">
            <div className="text-[13px] font-bold uppercase tracking-[0.3px] text-navy">
              About {resident.pref}
            </div>
            <p className="mt-[10px] text-[14.5px] leading-[1.6] text-ink-nav">
              {resident.note}
            </p>
          </div>
          <div className="rounded-xl border border-line-soft bg-cream p-[18px]">
            <div className="text-[13px] font-bold uppercase tracking-[0.3px] text-navy">
              Care flags
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {resident.flags.map((flag) => (
                <CareFlag key={flag} label={flag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
