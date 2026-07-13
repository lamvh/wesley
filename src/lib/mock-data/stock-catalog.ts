import type { Cart, Product, Provider, StockActivityEntry } from "@/types/domain";

const providers: Provider[] = [
  { id: "medsupply", name: "MedSupply NZ", cat: "Clinical & PPE", contact: "orders@medsupply.co.nz", phone: "09 555 0110", lead: "2–3 days", terms: "20th of month", pref: true, color: "#2C3563", tint: "#E4E6F2" },
  { id: "carewell", name: "CareWell Continence", cat: "Continence", contact: "sales@carewell.co.nz", phone: "09 555 0244", lead: "3–4 days", terms: "Net 30", pref: true, color: "#3d6b74", tint: "#DEEAEC" },
  { id: "freshfields", name: "Fresh Fields Foods", cat: "Kitchen & Nutrition", contact: "wholesale@freshfields.nz", phone: "09 555 0388", lead: "Next day", terms: "Net 14", pref: false, color: "#3F5137", tint: "#E5EBDD" },
  { id: "cleanco", name: "CleanCo Hygiene", cat: "Housekeeping", contact: "orders@cleanco.co.nz", phone: "09 555 0455", lead: "2–3 days", terms: "Net 30", pref: false, color: "#8A6516", tint: "#F3E8CE" },
];

const catalog: Product[] = [
  { id: "p1", name: "Nitrile gloves (M)", cat: "Clinical & PPE", unit: "box of 100", price: 12.5, prov: "medsupply", par: 20, qtyNow: 4 },
  { id: "p2", name: "Surgical masks", cat: "Clinical & PPE", unit: "box of 50", price: 9.0, prov: "medsupply", par: 30, qtyNow: 26 },
  { id: "p3", name: "Wound dressings", cat: "Clinical & PPE", unit: "pack of 10", price: 18.0, prov: "medsupply", par: 40, qtyNow: 48 },
  { id: "p4", name: "Hand sanitiser 500ml", cat: "Clinical & PPE", unit: "each", price: 6.5, prov: "medsupply", par: 24, qtyNow: 9 },
  { id: "p5", name: "Briefs — large", cat: "Continence", unit: "pack of 20", price: 22.0, prov: "carewell", par: 30, qtyNow: 12 },
  { id: "p6", name: "Bed pads", cat: "Continence", unit: "pack of 25", price: 15.0, prov: "carewell", par: 50, qtyNow: 55 },
  { id: "p7", name: "Wipes", cat: "Continence", unit: "pack of 80", price: 4.5, prov: "carewell", par: 30, qtyNow: 34 },
  { id: "p8", name: "Thickener", cat: "Kitchen & Nutrition", unit: "tin", price: 11.0, prov: "freshfields", par: 20, qtyNow: 7 },
  { id: "p9", name: "Supplement drinks", cat: "Kitchen & Nutrition", unit: "carton", price: 28.0, prov: "freshfields", par: 50, qtyNow: 62 },
  { id: "p10", name: "Tea & coffee", cat: "Kitchen & Nutrition", unit: "box", price: 8.0, prov: "freshfields", par: 24, qtyNow: 28 },
  { id: "p11", name: "Surface spray 750ml", cat: "Housekeeping", unit: "each", price: 5.0, prov: "cleanco", par: 24, qtyNow: 10 },
  { id: "p12", name: "Laundry powder 10kg", cat: "Housekeeping", unit: "sack", price: 34.0, prov: "cleanco", par: 8, qtyNow: 3 },
];

export function getProviders(): Provider[] {
  return providers;
}

export function getProductCatalog(): Product[] {
  return catalog;
}

export function providerName(id: string): string {
  return providers.find((p) => p.id === id)?.name ?? id;
}

/** Seed history for the stock activity log (most-recent first). */
export function getStockActivitySeed(): StockActivityEntry[] {
  return [
    { id: "sa1", at: "Yesterday 16:20", actor: "Sarah Mills", kind: "order_placed", summary: "Placed order · CareWell Continence", detail: "3 items · $118.00" },
    { id: "sa2", at: "Yesterday 09:05", actor: "Sarah Mills", kind: "reorder_autofill", summary: "Auto-filled reorder cart", detail: "8 below-par items topped to par" },
    { id: "sa3", at: "Mon 14:32", actor: "Aroha Ngata", kind: "stock_adjusted", summary: "Adjusted stock · Nitrile gloves (M)", detail: "40 → 120 box of 100" },
    { id: "sa4", at: "Mon 08:47", actor: "Sarah Mills", kind: "order_placed", summary: "Placed order · MedSupply NZ", detail: "5 items · $286.50" },
  ];
}

/** Fill every below-par product up to par. */
export function suggestReorderCart(): Cart {
  const cart: Cart = {};
  for (const p of catalog) {
    if (p.qtyNow < p.par) cart[p.id] = p.par - p.qtyNow;
  }
  return cart;
}
