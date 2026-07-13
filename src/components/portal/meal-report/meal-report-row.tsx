import { PersonBadge } from "@/components/shared/person-badge";
import { Input } from "@/components/ui/input";
import { MEAL_SLOTS } from "@/lib/mock-data";
import type { IntakeLevel, MealLog, MealReportResident } from "@/types/domain";
import { IntakeCell } from "./intake-cell";

type MealSlot = (typeof MEAL_SLOTS)[number];

// One resident row: identity, three intake selectors, and an (inert) note input.
export function MealReportRow({
  resident,
  log,
  onIntake,
}: {
  resident: MealReportResident;
  log: MealLog[number] | undefined;
  onIntake: (slot: MealSlot, level: IntakeLevel) => void;
}) {
  return (
    <div className="grid grid-cols-[1.7fr_1.1fr_1.1fr_1.1fr_1.3fr] items-center gap-[14px] border-b border-line-divider px-[22px] py-[14px]">
      <div className="flex min-w-0 items-center gap-3">
        <PersonBadge
          initials={resident.initials}
          color={resident.color}
          className="size-[38px] rounded-full text-[13px]"
        />
        <div className="min-w-0">
          <div className="truncate text-[14.5px] font-semibold text-ink">
            {resident.name}
          </div>
          <div className="text-[12px] text-ink-faint">
            {resident.room} · {resident.diet}
          </div>
        </div>
      </div>

      {MEAL_SLOTS.map((slot) => (
        <IntakeCell
          key={slot}
          selected={log?.[slot]}
          onSelect={(level) => onIntake(slot, level)}
        />
      ))}

      <Input
        placeholder="Add note…"
        className="h-auto rounded-[9px] border-line-soft bg-cream px-[10px] py-2 text-[13px] text-ink"
      />
    </div>
  );
}
