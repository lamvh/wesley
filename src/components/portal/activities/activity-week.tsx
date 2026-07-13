import { activityCatMeta } from "@/lib/design-meta";
import { cn } from "@/lib/utils";
import type { ActivityCategory, ActivityDay } from "@/types/domain";
import { ActivityChip } from "./activity-chip";

// Legend categories shown above the grid (colour paired with a text label).
const legend: { cat: ActivityCategory; label: string }[] = [
  { cat: "garden", label: "Garden" },
  { cat: "music", label: "Music" },
  { cat: "move", label: "Movement" },
  { cat: "social", label: "Social" },
  { cat: "care", label: "Wellbeing" },
  { cat: "faith", label: "Faith" },
];

// Seven-day programme: heading + category legend, then one column per day.
export function ActivityWeek({ week }: { week: ActivityDay[] }) {
  return (
    <section>
      <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-[10px]">
        <h2 className="font-serif text-[20px] font-semibold text-ink">
          This week&rsquo;s programme
        </h2>
        <div className="flex flex-wrap gap-[14px]">
          {legend.map((entry) => (
            <span
              key={entry.cat}
              className="flex items-center gap-[6px] text-[12px] text-ink-muted"
            >
              <span
                className={cn(
                  "size-[9px] rounded-full",
                  activityCatMeta[entry.cat].dot,
                )}
              />
              {entry.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4 lg:grid-cols-7">
        {week.map((day) => (
          <div
            key={day.dow}
            className="min-h-[280px] overflow-hidden rounded-[14px] border border-line bg-cream-2"
          >
            <div
              className={cn(
                "border-b border-line-divider px-[14px] py-3",
                day.isToday && "bg-navy-tint",
              )}
            >
              <div className="text-[12px] font-bold uppercase tracking-[0.6px] text-ink-faint">
                {day.dow}
              </div>
              <div className="font-serif text-[19px] text-ink">{day.date}</div>
            </div>
            <div className="flex flex-col gap-2 p-[10px]">
              {day.items.map((activity) => (
                <ActivityChip key={activity.title} activity={activity} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
