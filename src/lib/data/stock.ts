import { createClient } from "@/lib/supabase/server";
import type { Provider, Product, StockMovement, Order, MovementDir } from "@/types/domain";

const BUILDING = "wesley";

export async function getProviders(): Promise<Provider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("providers")
    .select("id,name,category,contact_email,phone,lead_time,terms,preferred,color,tint")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load providers: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id, name: r.name, cat: r.category, contact: r.contact_email ?? "",
    phone: r.phone ?? "", lead: r.lead_time ?? "", terms: r.terms ?? "",
    pref: r.preferred, color: r.color ?? "#2C3563", tint: r.tint ?? "#E4E6F2",
  }));
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products")
    .select("id,name,category,unit,price,provider_id,par,stock_levels(qty_now)")
    .eq("building_id", BUILDING).order("name");
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map((r) => {
    const lvl = Array.isArray(r.stock_levels) ? r.stock_levels[0] : r.stock_levels;
    return { id: r.id, name: r.name, cat: r.category, unit: r.unit ?? "",
      price: Number(r.price), prov: r.provider_id ?? "", par: r.par,
      qtyNow: lvl?.qty_now ?? 0 };
  });
}

function toMovement(r: Record<string, unknown>): StockMovement {
  return {
    id: r.id as string, productId: r.product_id as string,
    item: (r.item_name as string) ?? "", unit: (r.unit as string) ?? "",
    dir: r.direction as MovementDir, qty: r.qty as number, afterQty: r.after_qty as number,
    providerId: (r.provider_id as string) ?? undefined,
    unitPrice: r.unit_price != null ? Number(r.unit_price) : undefined,
    dests: (r.dests as StockMovement["dests"]) ?? undefined,
    receiver: (r.receiver as string) ?? undefined, note: (r.note as string) ?? undefined,
    by: (r.actor_name as string) ?? "", date: r.move_date as string,
  };
}

// item name + actor name are resolved via a view-ish select join.
const MOVE_COLS =
  "id,product_id,direction,qty,after_qty,unit,provider_id,unit_price,dests,receiver,note,move_date,products(name),app_users(name)";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join row shape isn't generated; cast at this row-mapping boundary.
function normalize(r: any) {
  return { ...r, item_name: r.products?.name, actor_name: r.app_users?.name };
}

export async function getMovements(limit = 100): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_movements")
    .select(MOVE_COLS).eq("building_id", BUILDING)
    .order("moved_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`Failed to load movements: ${error.message}`);
  return (data ?? []).map((r) => toMovement(normalize(r)));
}

export async function getMovementsForProduct(productId: string): Promise<StockMovement[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stock_movements")
    .select(MOVE_COLS).eq("building_id", BUILDING).eq("product_id", productId)
    .order("moved_at", { ascending: false });
  if (error) throw new Error(`Failed to load item history: ${error.message}`);
  return (data ?? []).map((r) => toMovement(normalize(r)));
}

export async function getOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("orders")
    .select("id,provider_id,status,placed_at,total_excl_gst,order_lines(product_id,qty,unit_price,products(name))")
    .eq("building_id", BUILDING).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase join row shape (order_lines/products) isn't generated; cast at this row-mapping boundary.
  return (data ?? []).map((r: any) => ({
    id: r.id, providerId: r.provider_id, status: r.status,
    placedAt: r.placed_at ?? undefined, totalExclGst: Number(r.total_excl_gst ?? 0),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- same join-row cast as above, one level down.
    lines: (r.order_lines ?? []).map((l: any) => ({
      productId: l.product_id, name: l.products?.name ?? "", qty: l.qty, unitPrice: Number(l.unit_price) })),
  }));
}
