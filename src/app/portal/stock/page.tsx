import { StockView } from "@/components/portal/stock/stock-view";

// Admin stock & supplies: inventory, ordering and providers across three tabs.
// Thin RSC shell; all interactivity lives in the StockView client island.
export default function StockPage() {
  return <StockView />;
}
