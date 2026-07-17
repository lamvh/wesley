"use client";

import { useState } from "react";
import { MovementLog } from "@/components/portal/stock/movement-log";
import { RecordMovementPanel } from "@/components/portal/stock/record-movement-panel";
import { ConfirmDeleteModal } from "@/components/portal/stock/confirm-delete-modal";
import { deleteMovement } from "@/lib/actions/stock";
import type { Product, Provider, StockMovement } from "@/types/domain";

// Stock in/out tab: 3 rolling-7-day KPIs, then a two-column grid - the
// global movement log (left) and the record-movement panel (right). Deletes
// go through the same confirm modal StockView uses for products/providers.

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface MoveKpi {
  label: string;
  value: string;
  sub: string;
  tone: string;
}

function computeKpis(movements: StockMovement[]): MoveKpi[] {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  const recent = movements.filter((m) => new Date(m.date).getTime() >= cutoff);
  const inQty = recent.filter((m) => m.dir === "in").reduce((a, m) => a + m.qty, 0);
  const outQty = recent.filter((m) => m.dir === "out").reduce((a, m) => a + m.qty, 0);
  const net = inQty - outQty;
  return [
    { label: "Stock in (7d)", value: `+${inQty}`, sub: "Units received", tone: "text-sage" },
    { label: "Stock out (7d)", value: `−${outQty}`, sub: "Units issued", tone: "text-rust" },
    {
      label: "Net (7d)",
      value: `${net >= 0 ? "+" : "−"}${Math.abs(net)}`,
      sub: "In minus out",
      tone: net >= 0 ? "text-sage" : "text-rust",
    },
  ];
}

export function MovementsTab({
  movements,
  products,
  providers,
}: {
  movements: StockMovement[];
  products: Product[];
  providers: Provider[];
}) {
  // Bumped after a successful record - remounts the panel so its local
  // state (direction, dest rows, uncontrolled fields) starts fresh.
  const [panelKey, setPanelKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const kpis = computeKpis(movements);

  function requestDelete(movement: StockMovement) {
    setConfirmError(null);
    setConfirmDelete({
      label: `${movement.item} movement`,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", movement.id);
        try {
          await deleteMovement(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  function onDelete(id: string) {
    const movement = movements.find((m) => m.id === id);
    if (movement) requestDelete(movement);
  }

  return (
    <>
      <div className="mt-[18px] grid grid-cols-3 gap-4 max-lg:grid-cols-1">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-line bg-cream-2 px-5 py-[18px]">
            <div className="text-[13px] font-semibold text-ink-meta">{k.label}</div>
            <div className={`mt-[6px] font-serif text-[30px] leading-none ${k.tone}`}>{k.value}</div>
            <div className="mt-1 text-[12.5px] text-ink-faint">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-[1fr_372px] items-start gap-[18px] max-lg:grid-cols-1">
        <MovementLog movements={movements} providers={providers} onDelete={onDelete} />
        <RecordMovementPanel
          key={panelKey}
          products={products}
          providers={providers}
          onRecorded={() => setPanelKey((k) => k + 1)}
        />
      </div>

      <ConfirmDeleteModal
        open={confirmDelete !== null}
        label={confirmDelete?.label ?? ""}
        body="This reverses the on-hand quantity change from this movement."
        error={confirmError ?? undefined}
        onCancel={() => {
          setConfirmDelete(null);
          setConfirmError(null);
        }}
        onConfirm={confirmDelete?.onConfirm ?? (() => {})}
      />
    </>
  );
}
