import { occupancyToneClass } from "@/lib/design-meta";
import type { OccupancyWing } from "@/types/domain";

// Occupancy card: per-wing label + filled/total + progress track. Fill width is
// a computed percentage, so it's set inline (the only sanctioned inline value).
export function OccupancyByWing({ wings }: { wings: OccupancyWing[] }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <h3 className="m-0 font-serif text-[20px] font-semibold">Occupancy by wing</h3>
      <div className="mt-[18px] flex flex-col gap-4">
        {wings.map((w) => (
          <div key={w.name}>
            <div className="mb-[6px] flex justify-between text-[14px]">
              <span className="font-semibold text-ink-soft">{w.name}</span>
              <span className="text-ink-meta">
                {w.filled}/{w.total}
              </span>
            </div>
            <div className="h-[9px] overflow-hidden rounded-full bg-line-soft">
              <div
                className={`h-full rounded-full ${occupancyToneClass[w.tone]}`}
                style={{ width: `${Math.round((w.filled / w.total) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
