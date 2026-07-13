import { intakeMeta, INTAKE_LEVELS } from "@/lib/design-meta";
import type { IntakeLevel } from "@/types/domain";
import { cn } from "@/lib/utils";

// Segmented four-button selector for one meal slot. The selected level wears its
// semantic badge tint; the rest stay muted. Clicking the active level again is
// handled by the parent (toggles it back off).
export function IntakeCell({
  selected,
  onSelect,
}: {
  selected?: IntakeLevel;
  onSelect: (level: IntakeLevel) => void;
}) {
  return (
    <div className="flex flex-wrap gap-[2px] rounded-[10px] border border-line-soft bg-cream p-[2px]">
      {INTAKE_LEVELS.map((level) => {
        const on = selected === level;
        return (
          <button
            key={level}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(level)}
            className={cn(
              "rounded-[8px] px-[9px] py-[6px] text-[12px] font-semibold whitespace-nowrap transition-colors",
              on ? intakeMeta[level].badge : "text-ink-faint hover:text-ink-muted",
            )}
          >
            {intakeMeta[level].label}
          </button>
        );
      })}
    </div>
  );
}
