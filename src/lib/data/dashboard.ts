import { createClient } from "@/lib/supabase/server";
import type { Kpi } from "@/types/domain";

// Live dashboard KPIs. The dashboard is the whole-organisation view, so
// anything that exists for more than one home is counted across ALL of them -
// it is the one screen that is deliberately not scoped to a building.
//
// Only figures with a real source are returned. The screen used to show four
// hardcoded numbers; "Open incidents" is not here because there is no incidents
// table to count, and inventing it beside real occupancy is how a demo number
// ends up being read as fact.

/** The home whose store the stock figures come from. Stock is single-site for
 *  now, so the low-stock KPI says so rather than implying it covers both. */
const STOCK_HOME = "wesley";

export async function getDashboardKpis(): Promise<Kpi[]> {
  const supabase = await createClient();

  const [roomsRes, residentsRes, buildingsRes, productsRes, levelsRes] = await Promise.all([
    supabase.from("rooms").select("building_id, status"),
    supabase.from("residents").select("building_id"),
    supabase.from("buildings").select("id, name"),
    supabase.from("products").select("id, par").eq("building_id", STOCK_HOME),
    supabase.from("stock_levels").select("product_id, qty_now").eq("building_id", STOCK_HOME),
  ]);

  const kpis: Kpi[] = [];
  const nameOf = new Map((buildingsRes.data ?? []).map((b) => [b.id, b.name]));

  // --- Occupancy, both homes ---
  const rooms = roomsRes.data ?? [];
  if (rooms.length > 0) {
    const total = rooms.length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const vacant = total - occupied;
    kpis.push({
      label: "Occupancy",
      value: `${Math.round((occupied / total) * 100)}%`,
      delta: vacant > 0 ? `${vacant} free` : "Full",
      deltaTone: vacant > 0 ? "warn" : "accent",
      sub: `${occupied} of ${total} rooms · all homes`,
    });
  }

  // --- Residents, both homes, broken down so the total is checkable ---
  const residents = residentsRes.data ?? [];
  if (residents.length > 0) {
    const perHome = new Map<string, number>();
    for (const r of residents) {
      const id = String(r.building_id);
      perHome.set(id, (perHome.get(id) ?? 0) + 1);
    }
    const breakdown = [...perHome.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => `${n} ${nameOf.get(id) ?? id}`)
      .join(" · ");
    kpis.push({
      label: "Residents",
      value: String(residents.length),
      sub: breakdown,
    });
  }

  // --- Low stock. Single-site data, and the sub line says which site. ---
  const products = productsRes.data ?? [];
  if (products.length > 0) {
    const qtyOf = new Map((levelsRes.data ?? []).map((l) => [l.product_id, l.qty_now]));
    // par 0 means "no reorder level set yet" - counting those as low would
    // flag every unconfigured item.
    const tracked = products.filter((p) => (p.par ?? 0) > 0);
    const below = tracked.filter((p) => (qtyOf.get(p.id) ?? 0) < (p.par ?? 0)).length;
    kpis.push({
      label: "Low stock",
      value: String(below),
      delta: below > 0 ? "Below par" : "All stocked",
      deltaTone: below > 0 ? "warn" : "accent",
      sub: `of ${tracked.length} tracked items · ${nameOf.get(STOCK_HOME) ?? STOCK_HOME} store`,
      valueTone: below > 0 ? "terracotta" : "ink",
    });
  }

  return kpis;
}
