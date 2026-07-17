"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getBuildingById } from "@/lib/mock-data";
import { useBuilding } from "@/lib/building-context";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { Button } from "@/components/ui/button";
import { deleteProduct, deleteProvider, placeOrder } from "@/lib/actions/stock";
import { stockLevel } from "@/lib/design-meta";
import { InventoryTab } from "@/components/portal/stock/inventory-tab";
import { MovementsTab } from "@/components/portal/stock/movements-tab";
import { OrderTab } from "@/components/portal/stock/order-tab";
import { ProvidersTab } from "@/components/portal/stock/providers-tab";
import { StockItemForm } from "@/components/portal/stock/stock-item-form";
import { ProviderForm } from "@/components/portal/stock/provider-form";
import { ItemHistoryModal } from "@/components/portal/stock/item-history-modal";
import { ConfirmDeleteModal } from "@/components/portal/stock/confirm-delete-modal";
import type { OrderCategory, OrderRow, CartGroup, CartLine } from "@/components/portal/stock/order-tab";
import type { Provider, Product, StockMovement, Order } from "@/types/domain";

type Tab = "inventory" | "movements" | "order" | "providers";

const TABS: { key: Tab; label: string }[] = [
  { key: "inventory", label: "Inventory" },
  { key: "movements", label: "Stock in/out" },
  { key: "order", label: "Place order" },
  { key: "providers", label: "Providers" },
];

// Header action button label swaps per tab.
const HEADER_ACTION_LABEL: Record<Tab, string> = {
  inventory: "+ Add item",
  movements: "View inventory",
  order: "Auto-fill reorder",
  providers: "+ Add provider",
};

interface StockViewProps {
  providers: Provider[];
  products: Product[];
  movements: StockMovement[];
  orders: Order[];
}

export function StockView({ providers, products, movements, orders }: StockViewProps) {
  const { buildingId } = useBuilding();
  const buildingName = getBuildingById(buildingId).name;

  // "On order" KPI: line count across every placed (not draft) order.
  const onOrderCount = orders
    .filter((o) => o.status === "placed")
    .reduce((a, o) => a + o.lines.length, 0);

  const [tab, setTab] = useState<Tab>("inventory");

  // Inventory item form: itemFormOpen + editProduct together decide add vs
  // edit - editProduct stays null for "+ Add item".
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ label: string; onConfirm: () => void } | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Provider form: providerFormOpen + editProvider together decide add vs
  // edit - editProvider stays null for "+ Add provider".
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [editProvider, setEditProvider] = useState<Provider | null>(null);

  // Order draft: cart[productId] = qty. orderPlaced flips true after a
  // successful placeOrder() and resets on any further cart edit.
  const [cart, setCart] = useState<Record<string, number>>({});
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const providerName = useMemo(() => {
    const byId = new Map(providers.map((p) => [p.id, p.name] as const));
    return (id: string) => byId.get(id) ?? "No provider";
  }, [providers]);

  // Catalog grouped by category (first-seen order), rows carry the current
  // draft qty for that product.
  const orderCats: OrderCategory[] = useMemo(() => {
    const seen: string[] = [];
    for (const p of products) if (!seen.includes(p.cat)) seen.push(p.cat);
    return seen.map((cat) => ({
      cat,
      items: products
        .filter((p) => p.cat === cat)
        .map((p): OrderRow => ({
          id: p.id,
          name: p.name,
          unit: p.unit,
          provName: providerName(p.prov),
          priceLabel: `$${p.price.toFixed(2)}`,
          stockLabel: `${p.qtyNow} / ${p.par}`,
          stockColor: stockLevel(p.qtyNow, p.par).swatch.text,
          qty: cart[p.id] ?? 0,
        })),
    }));
  }, [products, providerName, cart]);

  // Draft cart split into one purchase order per provider.
  const cartGroups: CartGroup[] = useMemo(() => {
    const byProv = new Map<string, { product: Product; qty: number }[]>();
    for (const p of products) {
      const qty = cart[p.id] ?? 0;
      if (qty <= 0) continue;
      if (!byProv.has(p.prov)) byProv.set(p.prov, []);
      byProv.get(p.prov)!.push({ product: p, qty });
    }
    return Array.from(byProv.entries()).map(([prov, entries]) => {
      const lines: CartLine[] = entries.map(({ product, qty }) => ({
        id: product.id,
        qty,
        name: product.name,
        lineLabel: `$${(qty * product.price).toFixed(2)}`,
      }));
      const subtotal = entries.reduce((sum, { product, qty }) => sum + qty * product.price, 0);
      return { prov, provName: providerName(prov), subtotalLabel: `$${subtotal.toFixed(2)}`, lines };
    });
  }, [products, cart, providerName]);

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const poCount = cartGroups.length;
  const cartTotal = useMemo(
    () => products.reduce((sum, p) => sum + (cart[p.id] ?? 0) * p.price, 0),
    [products, cart],
  );
  const cartTotalLabel = `$${cartTotal.toFixed(2)}`;
  const cartEmpty = cartCount === 0;

  function bumpCartQty(id: string, delta: number) {
    setCart((prev) => {
      const qty = (prev[id] ?? 0) + delta;
      const next = { ...prev };
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });
    setOrderPlaced(false);
    setOrderError(null);
  }

  function clearCart() {
    setCart({});
    setOrderPlaced(false);
    setOrderError(null);
  }

  async function placeCartOrder() {
    const fd = new FormData();
    fd.append("cart", JSON.stringify(cart));
    try {
      await placeOrder(fd);
      setCart({});
      setOrderPlaced(true);
      setOrderError(null);
    } catch (e) {
      setOrderError(e instanceof Error ? e.message : String(e));
    }
  }

  // Auto-fill reorder: top up every product below par to par.
  function autoFillReorder() {
    const next: Record<string, number> = {};
    for (const p of products) {
      if (p.qtyNow < p.par) next[p.id] = p.par - p.qtyNow;
    }
    setCart(next);
    setOrderPlaced(false);
  }

  function onHeaderAction() {
    if (tab === "inventory") {
      setEditProduct(null);
      setItemFormOpen(true);
    } else if (tab === "movements") {
      setTab("inventory");
    } else if (tab === "order") {
      autoFillReorder();
    } else if (tab === "providers") {
      setEditProvider(null);
      setProviderFormOpen(true);
    }
  }

  function closeItemForm() {
    setItemFormOpen(false);
    setEditProduct(null);
  }

  function openEditItem(product: Product) {
    setEditProduct(product);
    setItemFormOpen(true);
  }

  function openHistory(id: string) {
    setHistoryProduct(products.find((p) => p.id === id) ?? null);
  }

  function requestDeleteProduct(product: Product) {
    setConfirmError(null);
    setConfirmDelete({
      label: product.name,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", product.id);
        try {
          await deleteProduct(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  function closeProviderForm() {
    setProviderFormOpen(false);
    setEditProvider(null);
  }

  function openEditProvider(provider: Provider) {
    setEditProvider(provider);
    setProviderFormOpen(true);
  }

  function requestDeleteProvider(provider: Provider) {
    setConfirmError(null);
    setConfirmDelete({
      label: provider.name,
      onConfirm: async () => {
        const fd = new FormData();
        fd.set("id", provider.id);
        try {
          await deleteProvider(fd);
          setConfirmDelete(null);
          setConfirmError(null);
        } catch (e) {
          setConfirmError(e instanceof Error ? e.message : String(e));
        }
      },
    });
  }

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Stock & supplies"
        sub={`${buildingName} · inventory, stock in/out, ordering & providers`}
        actions={
          <Button
            onClick={onHeaderAction}
            className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            {HEADER_ACTION_LABEL[tab]}
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
          products={products}
          providers={providers}
          onOrderCount={onOrderCount}
          onEdit={openEditItem}
          onHistory={openHistory}
          onDelete={requestDeleteProduct}
        />
      )}
      {tab === "movements" && (
        <MovementsTab movements={movements} products={products} providers={providers} />
      )}
      {tab === "order" && (
        <OrderTab
          orderCats={orderCats}
          cartGroups={cartGroups}
          cartCount={cartCount}
          poCount={poCount}
          cartTotalLabel={cartTotalLabel}
          cartEmpty={cartEmpty}
          orderPlaced={orderPlaced}
          orderError={orderError}
          onBump={bumpCartQty}
          onPlace={placeCartOrder}
          onClear={clearCart}
        />
      )}
      {tab === "providers" && (
        <ProvidersTab
          providers={providers}
          onNewOrder={() => setTab("order")}
          onEdit={openEditProvider}
          onDelete={requestDeleteProvider}
        />
      )}

      {itemFormOpen && (
        <StockItemForm product={editProduct} providers={providers} onClose={closeItemForm} />
      )}
      {providerFormOpen && (
        <ProviderForm provider={editProvider} onClose={closeProviderForm} />
      )}
      <ItemHistoryModal
        key={historyProduct?.id ?? "none"}
        open={historyProduct !== null}
        product={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
      <ConfirmDeleteModal
        open={confirmDelete !== null}
        label={confirmDelete?.label ?? ""}
        error={confirmError ?? undefined}
        onCancel={() => {
          setConfirmDelete(null);
          setConfirmError(null);
        }}
        onConfirm={confirmDelete?.onConfirm ?? (() => {})}
      />
    </div>
  );
}
