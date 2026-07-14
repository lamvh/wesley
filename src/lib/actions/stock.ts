"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";

const BUILDING = "wesley";
export interface StockFormState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => { const v = str(fd, k); return v ? Number(v) : 0; };

export async function saveProduct(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const fields = { name, category: str(fd, "category") || "Other", unit: str(fd, "unit") || null,
    price: num(fd, "price"), provider_id: str(fd, "provider") || null, par: num(fd, "par") };
  const supabase = await createClient();
  const pid = id || `p-${Date.now()}`;
  const { error } = await supabase.from("products")
    .upsert({ id: pid, building_id: BUILDING, ...fields });
  if (error) return { error: error.message };
  const { error: le } = await supabase.from("stock_levels")
    .upsert({ product_id: pid, building_id: BUILDING, qty_now: num(fd, "qty"), updated_at: new Date().toISOString() });
  if (le) return { error: le.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteProduct(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove product: ${error.message}`);
  revalidatePath("/portal/stock");
}

// Thin wrapper so the item-history modal can fetch one product's moves
// directly from a client component without a full page data fetch.
export async function getItemHistory(productId: string) {
  const { getMovementsForProduct } = await import("@/lib/data/stock");
  return getMovementsForProduct(productId);
}

export async function saveProvider(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Name is required." };
  const fields = { name, category: str(fd, "category") || "Other", contact_email: str(fd, "contact") || null,
    phone: str(fd, "phone") || null, lead_time: str(fd, "lead") || null, terms: str(fd, "terms") || null,
    preferred: str(fd, "preferred") === "true" };
  const supabase = await createClient();
  const provId = id || `prov-${Date.now()}`;
  const { error } = await supabase.from("providers")
    .upsert({ id: provId, building_id: BUILDING, ...fields });
  if (error) return { error: error.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteProvider(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("providers").delete().eq("id", id);
  if (error) throw new Error(`Failed to remove provider: ${error.message}`);
  revalidatePath("/portal/stock");
}

export async function recordMovement(_p: StockFormState, fd: FormData): Promise<StockFormState> {
  const productId = str(fd, "productId");
  const dir = str(fd, "dir");
  if (!productId) return { error: "Choose an item." };
  if (dir !== "in" && dir !== "out") return { error: "Choose a direction." };
  const me = await getCurrentUser();
  const supabase = await createClient();

  let qty = 0; let dests: unknown = null; let receiver: string | null = null;
  let providerId: string | null = null; let unitPrice: number | null = null;
  if (dir === "in") {
    qty = num(fd, "qty");
    providerId = str(fd, "provider") || null;
    unitPrice = num(fd, "price") || null;
  } else {
    const parsed = JSON.parse(str(fd, "dests") || "[]") as { room: string; person: string; qty: number }[];
    const clean = parsed.map((d) => ({ ...d, qty: Number(d.qty) || 0 })).filter((d) => d.qty > 0);
    qty = clean.reduce((a, d) => a + d.qty, 0);
    dests = clean; receiver = str(fd, "receiver") || null;
  }
  if (qty <= 0) return { error: "Quantity must be greater than zero." };

  // Block issuing more than is on hand — keeps on-hand non-negative and makes
  // delete-movement reversals exact (no phantom stock).
  if (dir === "out") {
    const { data: lvl } = await supabase
      .from("stock_levels")
      .select("qty_now")
      .eq("product_id", productId)
      .eq("building_id", BUILDING)
      .maybeSingle();
    const onHand = lvl?.qty_now ?? 0;
    if (qty > onHand) {
      return { error: `Cannot issue ${qty} — only ${onHand} in stock.` };
    }
  }

  const { error } = await supabase.rpc("record_stock_movement", {
    p_product_id: productId, p_building_id: BUILDING, p_direction: dir, p_qty: qty,
    p_unit: str(fd, "unit") || null, p_provider_id: providerId, p_unit_price: unitPrice,
    p_dests: dests, p_receiver: receiver, p_note: str(fd, "note") || null,
    p_actor_id: me?.appUser?.id ?? null, p_move_date: str(fd, "date") || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/portal/stock");
  return {};
}

export async function deleteMovement(fd: FormData): Promise<void> {
  const id = str(fd, "id"); if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_stock_movement", { p_id: id });
  if (error) throw new Error(`Failed to remove movement: ${error.message}`);
  revalidatePath("/portal/stock");
}

// cart JSON: { [productId]: qty }. Splits into one order per provider.
export async function placeOrder(fd: FormData): Promise<void> {
  const cart = JSON.parse(str(fd, "cart") || "{}") as Record<string, number>;
  const ids = Object.keys(cart).filter((id) => cart[id] > 0);
  if (ids.length === 0) return;
  const me = await getCurrentUser();
  const supabase = await createClient();
  const { data: prods, error: pe } = await supabase.from("products")
    .select("id,provider_id,price").in("id", ids);
  if (pe) throw new Error(pe.message);
  const byProv = new Map<string, { productId: string; qty: number; price: number }[]>();
  for (const p of prods ?? []) {
    const prov = p.provider_id ?? "unknown";
    if (!byProv.has(prov)) byProv.set(prov, []);
    byProv.get(prov)!.push({ productId: p.id, qty: cart[p.id], price: Number(p.price) });
  }
  for (const [prov, lines] of byProv) {
    const total = lines.reduce((a, l) => a + l.qty * l.price, 0);
    const { data: order, error: oe } = await supabase.from("orders")
      .insert({ building_id: BUILDING, provider_id: prov === "unknown" ? null : prov,
        status: "placed", placed_by: me?.appUser?.id ?? null,
        placed_at: new Date().toISOString(), total_excl_gst: total })
      .select("id").single();
    if (oe) throw new Error(oe.message);
    const { error: le } = await supabase.from("order_lines").insert(
      lines.map((l) => ({ order_id: order.id, product_id: l.productId, qty: l.qty, unit_price: l.price })));
    if (le) throw new Error(le.message);
  }
  revalidatePath("/portal/stock");
}
