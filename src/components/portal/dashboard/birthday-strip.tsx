import { PersonBadge } from "@/components/shared/person-badge";
import { Icon } from "@/components/shared/icons";
import type { Birthday } from "@/types/domain";

// Single cream bar: leading cake-icon header cell + a pill per resident whose
// birthday falls in the current month.
export function BirthdayStrip({ birthdays }: { birthdays: Birthday[] }) {
  const count = birthdays.length;
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-cream-2 px-5 py-4">
      <div className="flex items-center gap-3 border-line-divider pr-[18px] sm:border-r">
        <div className="flex size-[38px] items-center justify-center rounded-[11px] bg-gold-tint text-gold-text">
          <Icon name="cake" />
        </div>
        <div className="leading-[1.15]">
          <div className="font-serif text-[18px] text-ink">Upcoming birthdays</div>
          <div className="text-[12.5px] text-ink-faint">
            {count === 0
              ? "None this month"
              : `This month · ${count} resident${count === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>
      {birthdays.map((b) => (
        <div
          key={`${b.name}-${b.date}`}
          className="flex items-center gap-[10px] rounded-full border border-line-soft bg-cream p-[5px]"
        >
          <PersonBadge
            initials={b.initials}
            color={b.color}
            className="size-8 rounded-full text-[11.5px]"
          />
          <div className="leading-[1.15]">
            <div className="text-[13px] font-semibold text-ink">{b.name}</div>
            <div className="text-[11.5px] text-ink-faint">{b.room}</div>
          </div>
          <div className="whitespace-nowrap rounded-full bg-gold-tint px-[10px] py-1 text-[11.5px] font-bold text-gold-text">
            {b.badge} · {b.date}
          </div>
        </div>
      ))}
    </div>
  );
}
