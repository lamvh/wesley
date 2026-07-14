import { StockView } from "@/components/portal/stock/stock-view";
import { getProviders, getProducts, getMovements, getOrders } from "@/lib/data/stock";

// Admin stock & supplies: inventory, movements, ordering and providers.
// RSC shell loads Supabase data; StockView is the interactive client island.
export default async function StockPage() {
  const [providers, products, movements, orders] = await Promise.all([
    getProviders(),
    getProducts(),
    getMovements(),
    getOrders(),
  ]);
  return (
    <StockView
      providers={providers}
      products={products}
      movements={movements}
      orders={orders}
    />
  );
}
