import { activityCatMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { Activity } from "@/types/domain";

// One programme entry: category-tinted chip. The category swatch sets the
// tint background + time colour; title/where override to neutral ink.
export function ActivityChip({ activity }: { activity: Activity }) {
  const meta = activityCatMeta[activity.category];

  return (
    <div className={cn("rounded-[10px] px-[11px] py-[9px]", meta.badge)}>
      <div className="text-[11.5px] font-bold">{activity.time}</div>
      <div className="mt-[2px] text-[13px] font-semibold leading-[1.25] text-ink">
        {activity.title}
      </div>
      <div className="mt-[2px] text-[11.5px] text-ink-meta">{activity.where}</div>
    </div>
  );
}
