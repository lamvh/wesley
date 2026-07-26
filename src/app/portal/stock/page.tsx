import { StockView } from "@/components/portal/stock/stock-view";
import { getProviders, getProducts, getMovements, getOrders } from "@/lib/data/stock";
import { getRoomRecords } from "@/lib/data/rooms";
import { listBuildings } from "@/lib/data/buildings";
import { buildRoomDestOptions } from "@/lib/stock-dest-options";

// Admin stock & supplies: inventory, movements, ordering and providers.
// RSC shell loads Supabase data; StockView is the interactive client island.
// The room register comes along so stock can be issued against real rooms and
// residents rather than retyped free text.
export default async function StockPage() {
  const [providers, products, movements, orders, rooms, buildings] = await Promise.all([
    getProviders(),
    getProducts(),
    getMovements(),
    getOrders(),
    getRoomRecords(),
    listBuildings(),
  ]);

  const homeNameById = Object.fromEntries(buildings.map((b) => [b.id, b.name]));

  return (
    <StockView
      providers={providers}
      products={products}
      movements={movements}
      orders={orders}
      roomOptions={buildRoomDestOptions(rooms, homeNameById)}
    />
  );
}
