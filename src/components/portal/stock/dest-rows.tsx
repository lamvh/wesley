import { cn } from "@/lib/utils";
import type { MovementDest } from "@/types/domain";

// Repeatable "issue to rooms" row editor for the OUT side of the
// record-movement panel: room / person / qty + remove, plus a running
// total and "+ Add room". Extracted from record-movement-panel.tsx to keep
// that file under the file-size guideline.

const smallFieldCls =
  "w-full rounded-[9px] border border-input bg-cream px-2 py-[9px] text-[13px] text-ink outline-none focus:border-navy";

export interface DestRow extends MovementDest {
  id: number;
}

export function DestRows({
  dests,
  unit,
  onUpdate,
  onAdd,
  onRemove,
}: {
  dests: DestRow[];
  unit: string;
  onUpdate: (id: number, patch: Partial<MovementDest>) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  const total = dests.reduce((a, d) => a + (Number(d.qty) || 0), 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12.5px] font-bold text-ink-soft">Issue to rooms</span>
        <span className="text-[12px] font-semibold text-rust">
          {total} {unit || "units"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {dests.map((d) => (
          <div key={d.id} className="grid grid-cols-[1.2fr_1.3fr_54px_32px] items-center gap-[7px]">
            <input
              value={d.room}
              onChange={(e) => onUpdate(d.id, { room: e.target.value })}
              placeholder="Room"
              aria-label="Room"
              className={smallFieldCls}
            />
            <input
              value={d.person}
              onChange={(e) => onUpdate(d.id, { person: e.target.value })}
              placeholder="Resident / area"
              aria-label="Resident or area"
              className={smallFieldCls}
            />
            <input
              type="number"
              min="0"
              value={d.qty || ""}
              onChange={(e) => onUpdate(d.id, { qty: Number(e.target.value) || 0 })}
              placeholder="0"
              aria-label="Quantity"
              className={cn(smallFieldCls, "text-center")}
            />
            <button
              type="button"
              onClick={() => onRemove(d.id)}
              disabled={dests.length === 1}
              title="Remove row"
              className="flex size-8 items-center justify-center rounded-[9px] border border-rust/25 bg-rust-tint text-[17px] leading-none text-rust disabled:cursor-not-allowed disabled:opacity-40"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-[9px] flex items-center gap-[6px] rounded-[9px] bg-navy-tint px-[14px] py-2 text-[13px] font-semibold text-navy"
      >
        <span className="text-[16px] leading-none">+</span>Add room
      </button>
    </div>
  );
}
