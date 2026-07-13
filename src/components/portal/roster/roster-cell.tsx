import type { ShiftType } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RosterCellProps {
  cellKey: string;
  colIndex: number;
  ids: string[];
  defs: Record<string, ShiftType>;
  pickerDefs: ShiftType[];
  staffName: string;
  dayLabel: string;
  isOpen: boolean;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string, id: string) => void;
  onClear: (key: string) => void;
}

// One staff × day cell: shift chips (or a faint "+"), plus a popover shift
// picker when open. Chip/swatch colors are per-type DATA (inline styles).
export function RosterCell({
  cellKey,
  colIndex,
  ids,
  defs,
  pickerDefs,
  staffName,
  dayLabel,
  isOpen,
  onOpen,
  onClose,
  onToggle,
  onClear,
}: RosterCellProps) {
  const flipRight = colIndex >= 4;
  return (
    <td
      onClick={() => onOpen(cellKey)}
      className={cn(
        "relative cursor-pointer border-l border-line-divider p-[7px] align-top",
        isOpen ? "bg-cream" : "bg-transparent",
      )}
      style={{ minHeight: "58px" }}
    >
      {ids.map((id) => {
        const d = defs[id];
        return (
          <div
            key={id}
            style={{ borderColor: d.border, background: d.tint, color: d.color }}
            className="mb-[3px] block w-full rounded-[7px] border px-[7px] py-1 text-left text-[11.5px] font-bold leading-[1.25]"
          >
            {d.code}
            <div className="text-[10px] font-medium opacity-85">{d.time}</div>
          </div>
        );
      })}

      {ids.length === 0 && (
        <div className="text-center text-[16px] font-normal leading-[44px] text-line-strong">
          +
        </div>
      )}

      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close shift picker"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="fixed inset-0 z-[55] cursor-default"
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute top-full z-[60] mt-1 w-[236px] rounded-[13px] border border-field bg-cream-2 p-[11px] shadow-[0_18px_44px_-14px_rgba(30,28,20,0.42)]",
              flipRight ? "right-[4px]" : "left-[4px]",
            )}
          >
            <div className="mb-[9px] flex items-center justify-between">
              <div className="text-[12.5px] font-bold leading-[1.2] text-ink">
                {staffName}
                <div className="text-[11px] font-medium text-ink-faint">
                  {dayLabel}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClear(cellKey)}
                className="px-1 py-[2px] text-[11.5px] font-semibold text-rust"
              >
                Day off
              </button>
            </div>
            {pickerDefs.map((d) => {
              const on = ids.includes(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onToggle(cellKey, d.id)}
                  style={on ? { borderColor: d.border, background: d.tint } : undefined}
                  className={cn(
                    "mb-[5px] flex w-full items-center gap-[9px] rounded-[9px] border px-[9px] py-[7px] text-left",
                    on ? "" : "border-line-divider bg-cream-2",
                  )}
                >
                  <span
                    style={{ background: d.color }}
                    className="size-[10px] shrink-0 rounded-[3px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-bold text-ink">
                      {d.code}{" "}
                      <span className="font-medium text-ink-faint">
                        · {d.time}
                      </span>
                    </span>
                  </span>
                  {on && (
                    <span className="text-[14px] font-extrabold text-sage">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </td>
  );
}
