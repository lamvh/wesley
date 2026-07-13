"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  getBuildingById,
  getProductCatalog,
  getProviders,
  getStockActivitySeed,
  providerName,
  suggestReorderCart,
} from "@/lib/mock-data";
import { useBuilding } from "@/lib/building-context";
import { usePortalRole } from "@/lib/role-context";
import { portalIdentity } from "@/lib/portal-identity";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { Button } from "@/components/ui/button";
import { InventoryTab } from "@/components/portal/stock/inventory-tab";
import { ProvidersTab } from "@/components/portal/stock/providers-tab";
import { StockActivityTab } from "@/components/portal/stock/stock-activity-tab";
import {
  OrderTab,
  type CartGroup,
  type OrderCategory,
} from "@/components/portal/stock/order-tab";
import type { Cart, StockActivityEntry } from "@/types/domain";

type Tab = "inventory" | "order" | "providers" | "activity";

const TABS: { key: Tab; label: string }[] = [
  { key: "inventory", label: "Inventory" },
  { key: "order", label: "Place order" },
  { key: "providers", label: "Providers" },
  { key: "activity", label: "Activity" },
];

// Clock label for a freshly logged action ("Today 09:14").
function nowLabel(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Today ${hh}:${mm}`;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export function StockView() {
  const { buildingId } = useBuilding();
  const buildingName = getBuildingById(buildingId).name;
  const { role } = usePortalRole();
  const actor = portalIdentity(role).name;

  const [tab, setTab] = useState<Tab>("inventory");
  const [cart, setCart] = useState<Cart>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activity, setActivity] = useState<StockActivityEntry[]>(getStockActivitySeed);
  const [logSeq, setLogSeq] = useState(0);

  const catalog = getProductCatalog();
  const providers = getProviders();

  // Record one or more actions to the activity log (newest first).
  function logActions(items: Omit<StockActivityEntry, "id" | "at" | "actor">[]) {
    if (items.length === 0) return;
    const at = nowLabel();
    setActivity((prev) => [
      ...items.map((it, i) => ({ ...it, id: `log-${logSeq + i}`, at, actor })),
      ...prev,
    ]);
    setLogSeq((n) => n + items.length);
  }

  function bumpCart(id: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev };
      const q = (next[id] || 0) + delta;
      if (q <= 0) delete next[id];
      else next[id] = q;
      return next;
    });
    setOrderPlaced(false);
  }
  const autoFill = () => {
    const fill = suggestReorderCart();
    setCart(fill);
    setOrderPlaced(false);
    logActions([
      {
        kind: "reorder_autofill",
        summary: "Auto-filled reorder cart",
        detail: `${Object.keys(fill).length} below-par items topped to par`,
      },
    ]);
  };
  const placeOrder = () => {
    // One logged order per provider PO, grouped from the cart before it clears.
    const byProvider = new Map<string, { name: string; lines: number; subtotal: number }>();
    for (const p of catalog) {
      const qty = cart[p.id];
      if (!qty) continue;
      const g = byProvider.get(p.prov) ?? { name: providerName(p.prov), lines: 0, subtotal: 0 };
      g.lines += 1;
      g.subtotal += qty * p.price;
      byProvider.set(p.prov, g);
    }
    logActions(
      [...byProvider.values()].map((g) => ({
        kind: "order_placed" as const,
        summary: `Placed order · ${g.name}`,
        detail: `${g.lines} items · ${money(g.subtotal)}`,
      })),
    );
    setCart({});
    setOrderPlaced(true);
  };
  const clearCart = () => {
    const count = Object.values(cart).reduce((a, q) => a + q, 0);
    if (count > 0) {
      logActions([
        { kind: "cart_cleared", summary: "Cleared order cart", detail: `${count} items removed` },
      ]);
    }
    setCart({});
    setOrderPlaced(false);
  };

  // Catalog grouped by category, each row carrying its cart qty + stock colour.
  const orderCats: OrderCategory[] = [];
  for (const p of catalog) {
    let g = orderCats.find((x) => x.cat === p.cat);
    if (!g) {
      g = { cat: p.cat, items: [] };
      orderCats.push(g);
    }
    const low = p.qtyNow < p.par;
    g.items.push({
      id: p.id,
      name: p.name,
      unit: p.unit,
      provName: providerName(p.prov),
      priceLabel: money(p.price),
      stockLabel: `${p.qtyNow} / ${p.par}`,
      stockColor: low
        ? p.qtyNow < p.par * 0.5
          ? "text-terracotta"
          : "text-amber"
        : "text-sage",
      qty: cart[p.id] || 0,
    });
  }

  // Cart grouped by provider — each provider becomes a separate purchase order.
  const cartGroups: CartGroup[] = [];
  for (const p of catalog) {
    const qty = cart[p.id];
    if (!qty) continue;
    let g = cartGroups.find((x) => x.prov === p.prov);
    if (!g) {
      g = { prov: p.prov, provName: providerName(p.prov), subtotalLabel: "", lines: [] };
      cartGroups.push(g);
    }
    g.lines.push({ id: p.id, qty, name: p.name, lineLabel: money(qty * p.price) });
  }
  let cartTotal = 0;
  for (const p of catalog) {
    const qty = cart[p.id];
    if (qty) cartTotal += qty * p.price;
  }
  for (const g of cartGroups) {
    const subtotal = g.lines.reduce((a, l) => {
      const prod = catalog.find((p) => p.id === l.id);
      return a + (prod ? l.qty * prod.price : 0);
    }, 0);
    g.subtotalLabel = money(subtotal);
  }

  const cartCount = Object.values(cart).reduce((a, q) => a + q, 0);
  const poCount = cartGroups.length;
  const cartEmpty = cartCount === 0;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Stock & supplies"
        sub={`${buildingName} · inventory, ordering & providers`}
        actions={
          <Button
            onClick={autoFill}
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            Auto-fill reorder
          </Button>
        }
      />

      <div className="mt-5 inline-flex gap-1 rounded-full border border-line-soft bg-toggle-track p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-[18px] py-[9px] text-[14px] font-semibold transition",
              tab === t.key ? "bg-navy-deep text-cream" : "text-ink-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "inventory" && (
        <InventoryTab
          catalog={catalog}
          cartCount={cartCount}
          poCount={poCount}
          cartTotalLabel={money(cartTotal)}
        />
      )}
      {tab === "order" && (
        <OrderTab
          orderCats={orderCats}
          cartGroups={cartGroups}
          cartCount={cartCount}
          poCount={poCount}
          cartTotalLabel={money(cartTotal)}
          cartEmpty={cartEmpty}
          orderPlaced={orderPlaced}
          onBump={bumpCart}
          onPlace={placeOrder}
          onClear={clearCart}
        />
      )}
      {tab === "providers" && (
        <ProvidersTab providers={providers} onNewOrder={() => setTab("order")} />
      )}
      {tab === "activity" && <StockActivityTab entries={activity} />}
    </div>
  );
}
