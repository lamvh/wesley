"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
// createPortal is only reached when the picker is open — a client-only state
// that is always false during SSR — so document is never touched on the server.
import { createPortal } from "react-dom";
import type { ShiftType } from "@/types/domain";
import { cn } from "@/lib/utils";

interface RosterCellProps {
  cellKey: string;
  colIndex: number;
  ids: string[];
  defs: Record<string, ShiftType>;
  pickerDefs: ShiftType[];
  staffName: string;
  staffRole: string;
  dayLabel: string;
  isOpen: boolean;
  onOpen: (key: string) => void;
  onClose: () => void;
  onToggle: (key: string, id: string) => void;
  onClear: (key: string) => void;
}

const POPOVER_W = 236;

// One staff × day cell: shift chips (or a faint "+"), plus a popover shift
// picker when open. The picker is portalled to the body with fixed positioning
// so it is never clipped by the roster's scroll container (which keeps the
// weekday/group headers sticky). Chip/swatch colors are per-type DATA.
export function RosterCell({
  cellKey,
  colIndex,
  ids,
  defs,
  pickerDefs,
  staffName,
  staffRole,
  dayLabel,
  isOpen,
  onOpen,
  onClose,
  onToggle,
  onClear,
}: RosterCellProps) {
  const tdRef = useRef<HTMLTableCellElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const flipRight = colIndex >= 4;

  // Anchor the fixed popover to the cell each time it opens, clamped to the
  // viewport so it never overflows an edge.
  useLayoutEffect(() => {
    if (!isOpen || !tdRef.current) {
      setPos(null);
      return;
    }
    const r = tdRef.current.getBoundingClientRect();
    const left = flipRight ? r.right - POPOVER_W : r.left + 4;
    const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - POPOVER_W - 8));
    setPos({ top: r.bottom + 4, left: clampedLeft });
  }, [isOpen, flipRight]);

  // A fixed popover detaches from its anchor on scroll/resize — close it so it
  // never lingers in the wrong place. Scrolls inside the popover's own shift
  // list must not close it, so ignore scroll events originating within it.
  useEffect(() => {
    if (!isOpen) return;
    const close = () => onClose();
    const onScroll = (e: Event) => {
      if (popoverRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener("resize", close);
    document.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", onScroll, true);
    };
  }, [isOpen, onClose]);

  return (
    <td
      ref={tdRef}
      onClick={() => onOpen(cellKey)}
      className={cn(
        "relative cursor-pointer border-l border-line-divider p-[7px] align-top",
        isOpen ? "bg-cream" : "bg-transparent",
      )}
      style={{ minHeight: "58px" }}
    >
      {ids.map((id) => {
        const d = defs[id];
        // Skip assignments whose shift type no longer exists (e.g. a template
        // that was deleted) rather than crashing on an undefined def.
        if (!d) return null;
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

      {isOpen && pos &&
        createPortal(
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
              ref={popoverRef}
              onClick={(e) => e.stopPropagation()}
              style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
              className="fixed z-[60] rounded-[13px] border border-field bg-cream-2 p-[11px] shadow-[0_18px_44px_-14px_rgba(30,28,20,0.42)]"
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
              {/* Which role's shifts this cell offers — the picker is a flat
                  list filtered to the staffer's role group (see rosterPickersFor). */}
              {staffRole && (
                <div className="mt-[-3px] mb-[9px] text-[10.5px] font-semibold text-ink-faint">
                  Shifts for {staffRole}
                </div>
              )}
              <div className="max-h-[46vh] overflow-y-auto">
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
            </div>
          </>,
          document.body,
        )}
    </td>
  );
}
