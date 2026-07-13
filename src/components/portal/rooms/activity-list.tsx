// Today's activities card (occupied rooms only). Each row is a bronze dot +
// the activity headline for the room's wing.
export function ActivityList({ activities }: { activities: string[] }) {
  return (
    <div className="rounded-2xl border border-line bg-cream-2 p-[22px]">
      <h3 className="font-serif text-[19px] font-semibold text-ink">
        Today&apos;s activities
      </h3>
      <div className="mt-[10px] flex flex-col">
        {activities.map((activity) => (
          <div
            key={activity}
            className="flex items-center gap-3 border-b border-line-divider py-[11px]"
          >
            <span className="size-2 shrink-0 rounded-full bg-bronze" aria-hidden />
            <span className="text-[14px] text-ink-soft">{activity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
