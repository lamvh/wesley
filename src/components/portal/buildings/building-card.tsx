"use client";

import type { Building } from "@/types/domain";
import { occupancyPct } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

interface BuildingCardProps {
  building: Building;
  active: boolean;
  onSelect: () => void;
}

// One care-home card. The per-building color/tint are data (like a person
// badge), so they drive the avatar background, the active border, and the
// "Viewing" badge via inline style; everything else is token utilities.
export function BuildingCard({ building: b, active, onSelect }: BuildingCardProps) {
  const pct = occupancyPct(b);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{ borderColor: active ? b.color : undefined }}
      className={cn(
        "cursor-pointer overflow-hidden rounded-[16px] border border-line bg-cream-2",
        "transition-colors",
      )}
    >
      {/* Header: avatar + name + active badge */}
      <div className="flex items-center gap-[14px] border-b border-line-divider px-[22px] py-5">
        <div
          style={{ background: b.color }}
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-[14px] font-serif text-[26px] font-semibold text-white"
        >
          {b.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-[22px] font-semibold text-ink">{b.name}</div>
          <div className="text-[13px] text-ink-faint">
            {b.full} · {b.suburb}
          </div>
        </div>
        {active && (
          <span
            style={{ color: b.color, background: b.tint }}
            className="rounded-full px-[11px] py-1 text-[11.5px] font-bold"
          >
            Viewing
          </span>
        )}
      </div>

      {/* Stats: Suites / Occupancy / Staff */}
      <div className="grid grid-cols-3 gap-[14px] px-[22px] py-5">
        <div>
          <div className="font-serif text-[26px] leading-none text-ink">{b.suites}</div>
          <div className="mt-[3px] text-[12px] text-ink-faint">Suites</div>
        </div>
        <div>
          <div className="font-serif text-[26px] leading-none text-sage">{pct}%</div>
          <div className="mt-[3px] text-[12px] text-ink-faint">Occupancy</div>
        </div>
        <div>
          <div className="font-serif text-[26px] leading-none text-ink">{b.staff}</div>
          <div className="mt-[3px] text-[12px] text-ink-faint">Staff</div>
        </div>
      </div>

      {/* Wings + site manager + action */}
      <div className="px-[22px] pb-[18px]">
        <div className="mb-[7px] text-[11px] font-bold uppercase tracking-[0.4px] text-ink-faint">
          Wings
        </div>
        <div className="mb-[14px] text-[13.5px] text-ink-soft">{b.wings.join(", ")}</div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-[13px] text-ink-muted">
            Site manager · <b className="text-ink">{b.mgr}</b>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="rounded-[10px] bg-navy-tint px-[14px] py-2 text-[13px] font-semibold text-navy"
          >
            View this site
          </button>
        </div>
      </div>
    </div>
  );
}
