import { Icon } from "@/components/shared/icons";
import { PersonBadge } from "@/components/shared/person-badge";
import type { Birthday } from "@/types/domain";

// Resident birthdays falling in the current month: cake-icon header + one row
// per birthday (avatar, name·room·home, gold age badge + date).
export function UpcomingBirthdays({ birthdays }: { birthdays: Birthday[] }) {
  const count = birthdays.length;
  return (
    <div className="rounded-[16px] border border-line bg-cream-2 p-5">
      <div className="flex items-center gap-[10px]">
        <div className="flex size-8 items-center justify-center rounded-[9px] bg-gold-tint text-gold-text">
          <Icon name="cake" size={18} />
        </div>
        <div className="leading-[1.2]">
          <h2 className="font-serif text-[19px] font-semibold text-ink">
            Upcoming birthdays
          </h2>
          <div className="text-[12.5px] text-ink-faint">
            {count === 0
              ? "None this month"
              : `This month · ${count} resident${count === 1 ? "" : "s"}`}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-[2px]">
        {birthdays.map((birthday) => (
          <div
            key={`${birthday.name}-${birthday.date}`}
            className="flex items-center gap-3 border-b border-line-divider py-[11px]"
          >
            <PersonBadge
              initials={birthday.initials}
              color={birthday.color}
              className="size-9 rounded-full text-[12.5px]"
            />
            <div className="flex-1">
              <div className="text-[14px] font-semibold text-ink">
                {birthday.name}
              </div>
              <div className="text-[12.5px] text-ink-faint">{birthday.room}</div>
            </div>
            <div className="text-right">
              <div className="text-[13px] font-bold text-gold-text">
                {birthday.badge}
              </div>
              <div className="text-[12px] text-ink-faint">{birthday.date}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
