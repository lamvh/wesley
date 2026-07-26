import { PersonBadge } from "@/components/shared/person-badge";
import { StatTile } from "./stat-tile";
import { CareFlag } from "./care-flag";
import { RoomCard } from "./room-card";
import type { Resident } from "@/types/domain";

// Full resident profile card: gradient banner (per-record colour → navy), an
// avatar overlapping the banner, the name sitting on the card below it, 4 stat
// tiles, About + Care flags. The care-tier badge was retired from the design.
// The banner start colour is data-driven (the sanctioned inline-colour
// exception, like PersonBadge); the navy end reads the token via CSS var.
/** ISO date -> "12 Mar 1941". Blank stays an em-dash rather than "Invalid Date". */
function formatDate(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function ResidentProfileHeader({ resident }: { resident: Resident }) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-cream-2">
      <div
        className="h-[84px]"
        style={{
          backgroundImage: `linear-gradient(90deg, ${resident.color}, var(--color-navy))`,
        }}
        aria-hidden
      />
      <div className="px-7 pb-[26px]">
        <div className="flex items-end gap-[18px]">
          <PersonBadge
            initials={resident.avatar}
            color={resident.color}
            serif
            className="-mt-[44px] size-[88px] rounded-[20px] border-4 border-cream-2 text-[34px]"
          />
          <div className="flex-1 pt-3">
            <h2 className="font-serif text-[29px] font-semibold leading-[1.1] text-ink">
              {resident.name}
            </h2>
            <div className="mt-1 text-[14.5px] text-ink-muted">
              Prefers &ldquo;{resident.pref}&rdquo; · Room {resident.room}
              {resident.nhi && <> · NHI {resident.nhi}</>}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-[14px] md:grid-cols-4">
          <StatTile label="Age" value={String(resident.age)} emphasis />
          <StatTile label="Mobility" value={resident.mobility} />
          <StatTile label="Diet" value={resident.diet} />
          <StatTile label="GP" value={resident.gp} />
        </div>

        {/* Admission record. Rendered separately from the care tiles above
            because these are administrative facts, and each is blank until
            someone records it - an em-dash rather than an invented value. */}
        <div className="mt-[14px] grid grid-cols-2 gap-[14px] md:grid-cols-4">
          <StatTile label="Location in facility" value={resident.room || "—"} />
          <StatTile label="Date of birth" value={formatDate(resident.dob)} />
          <StatTile label="Date of admission" value={formatDate(resident.admittedOn)} />
          <StatTile label="Gender" value={resident.gender || "—"} />
          <StatTile label="Group" value={resident.group || "—"} />
          <StatTile label="Phone" value={resident.phone || "—"} />
          <StatTile label="NHI number" value={resident.nhi || "—"} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
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
          <RoomCard room={resident.room} />
        </div>
      </div>
    </div>
  );
}
