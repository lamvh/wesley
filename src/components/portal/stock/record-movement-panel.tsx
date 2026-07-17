"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { recordMovement } from "@/lib/actions/stock";
import { DestRows, type DestRow } from "@/components/portal/stock/dest-rows";
import type { MovementDest, MovementDir, Product, Provider } from "@/types/domain";

// Sticky dark record-movement panel (mirrors order-tab's order-draft aside):
// a direction toggle, item + date, an IN block (qty/provider/price) or an OUT
// block (repeatable per-room issue rows via DestRows + received-by), a note,
// and submit. Direction + dest rows are local state driven purely by event
// handlers (no setState-in-effect); dests/dir/unit are threaded to the
// server action via hidden inputs whose values track that state on every
// render. On a successful submit the parent remounts this panel via `key`
// (see stock-item-form.tsx for the same reset-via-effect-callback idiom) so
// all local state - controlled and uncontrolled - starts fresh.

const fieldCls =
  "w-full rounded-[11px] border border-input bg-cream px-3 py-[11px] text-[14px] text-ink outline-none focus:border-navy";
const labelCls = "mb-[7px] block text-[12.5px] font-bold text-ink-soft";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RecordMovementPanel({
  products,
  providers,
  onRecorded,
}: {
  products: Product[];
  providers: Provider[];
  onRecorded: () => void;
}) {
  const [state, action, pending] = useActionState(recordMovement, {});
  const [dir, setDir] = useState<MovementDir>("in");
  const [productId, setProductId] = useState(products[0]?.id ?? "");

  // Row ids are only for React keys (add/remove stability) - start at 1
  // since the initial row below is hardcoded as id 0.
  const rowId = useRef(1);
  const [dests, setDests] = useState<DestRow[]>([{ id: 0, room: "", person: "", qty: 0 }]);

  // Fresh state on a successful (error-free) submit - reported to the
  // parent, which remounts this component via `key` instead of us calling
  // local setState from inside an effect.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending && !state.error) onRecorded();
    wasPending.current = pending;
  }, [pending, state.error, onRecorded]);

  const unit = products.find((p) => p.id === productId)?.unit ?? "";

  function updateDest(id: number, patch: Partial<MovementDest>) {
    setDests((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addDest() {
    setDests((rows) => [...rows, { id: rowId.current++, room: "", person: "", qty: 0 }]);
  }
  function removeDest(id: number) {
    setDests((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  return (
    <aside className="sticky top-[88px] overflow-hidden rounded-2xl border border-line bg-cream-2">
      <div className="border-b border-line-divider bg-navy-deep px-5 py-4">
        <div className="font-serif text-[19px] font-semibold text-cream">Record movement</div>
        <div className="mt-[2px] text-[12.5px] text-sidebar-idle">Adjust on-hand stock in or out</div>
      </div>

      <form action={action} className="flex flex-col gap-4 p-5">
        <input type="hidden" name="dir" value={dir} />
        <input type="hidden" name="unit" value={unit} />
        {dir === "out" && (
          <input
            type="hidden"
            name="dests"
            value={JSON.stringify(dests.map(({ room, person, qty }) => ({ room, person, qty })))}
          />
        )}

        <div className="grid grid-cols-2 gap-[9px]">
          <button
            type="button"
            onClick={() => setDir("in")}
            className={cn(
              "rounded-[10px] py-[10px] text-[13.5px] font-semibold transition",
              dir === "in" ? "bg-sage text-cream" : "border border-line-soft bg-cream text-ink-soft",
            )}
          >
            Stock in
          </button>
          <button
            type="button"
            onClick={() => setDir("out")}
            className={cn(
              "rounded-[10px] py-[10px] text-[13.5px] font-semibold transition",
              dir === "out" ? "bg-rust text-cream" : "border border-line-soft bg-cream text-ink-soft",
            )}
          >
            Stock out
          </button>
        </div>

        <label>
          <span className={labelCls}>Item</span>
          <select
            name="productId"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            required
            className={fieldCls}
          >
            {products.length === 0 && <option value="">No items in catalog</option>}
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelCls}>Date</span>
          <input type="date" name="date" defaultValue={todayIso()} required className={fieldCls} />
        </label>

        {dir === "in" ? (
          <>
            <label>
              <span className={labelCls}>Quantity</span>
              <input type="number" name="qty" min="1" placeholder="0" required className={fieldCls} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className={labelCls}>Provider</span>
                <select name="provider" defaultValue="" className={fieldCls}>
                  <option value="">No provider</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelCls}>Unit price ($)</span>
                <input type="number" name="price" min="0" step="0.01" placeholder="0.00" className={fieldCls} />
              </label>
            </div>
          </>
        ) : (
          <>
            <DestRows dests={dests} unit={unit} onUpdate={updateDest} onAdd={addDest} onRemove={removeDest} />
            <label>
              <span className={labelCls}>Received by</span>
              <input name="receiver" placeholder="Staff who collected" className={fieldCls} />
            </label>
          </>
        )}

        <label>
          <span className={labelCls}>Note</span>
          <input name="note" placeholder="Optional note" className={fieldCls} />
        </label>

        {state.error && (
          <p role="alert" className="rounded-[10px] border border-high/30 bg-high-tint px-[13px] py-[10px] text-[13px] font-medium text-high">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || products.length === 0}
          className={cn(
            "w-full rounded-[11px] py-[13px] text-[14.5px] font-semibold text-cream transition disabled:cursor-not-allowed disabled:opacity-50",
            dir === "in" ? "bg-sage" : "bg-rust",
          )}
        >
          {pending ? "Recording…" : dir === "in" ? "Record stock in" : "Record stock out"}
        </button>
      </form>
    </aside>
  );
}
