import type { Kpi, StockGroup, SupplyItem } from "@/types/domain";

const mkItem = (name: string, qty: number, par: number, unit: string): SupplyItem => ({
  name,
  qty,
  par,
  unit,
});

const stockGroups: StockGroup[] = [
  {
    category: "Clinical & PPE",
    items: [
      mkItem("Nitrile gloves (M)", 4, 20, "boxes"),
      mkItem("Surgical masks", 26, 30, "boxes"),
      mkItem("Wound dressings", 48, 40, "packs"),
      mkItem("Hand sanitiser 500ml", 9, 24, "bottles"),
    ],
  },
  {
    category: "Continence",
    items: [
      mkItem("Briefs — large", 12, 30, "packs"),
      mkItem("Bed pads", 55, 50, "packs"),
      mkItem("Wipes", 34, 30, "packs"),
    ],
  },
  {
    category: "Housekeeping",
    items: [
      mkItem("Laundry detergent", 6, 12, "drums"),
      mkItem("Surface cleaner", 18, 15, "bottles"),
      mkItem("Rubbish liners", 40, 40, "rolls"),
    ],
  },
  {
    category: "Kitchen & Nutrition",
    items: [
      mkItem("Thickener", 7, 20, "tins"),
      mkItem("Supplement drinks", 62, 50, "cartons"),
      mkItem("Tea & coffee", 28, 24, "boxes"),
    ],
  },
];

export function getStockGroups(): StockGroup[] {
  return stockGroups;
}

export function getStockKpis(): Kpi[] {
  return [
    { label: "Items tracked", value: "48", sub: "Across 4 categories", valueTone: "ink" },
    { label: "Low stock", value: "5", sub: "Below par level", valueTone: "amber" },
    { label: "Reorder now", value: "2", sub: "Urgent — below 50%", valueTone: "terracotta" },
    { label: "On order", value: "3", sub: "Arriving Mon 13 Jul", valueTone: "navy" },
  ];
}
