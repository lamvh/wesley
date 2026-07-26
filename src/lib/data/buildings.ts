import { createClient } from "@/lib/supabase/server";

// Buildings for the account building picker (Wesley / The Lodge).
export async function listBuildings(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("buildings")
    .select("id, name")
    .order("name");
  if (error || !data) return [{ id: "wesley", name: "Wesley" }];
  return data.map((b) => ({ id: b.id, name: b.name }));
}

/** Display name of one building, for screens that show a single record and must
 *  say which home it belongs to. Falls back to the id if the row is missing. */
export async function getBuildingName(id: string): Promise<string> {
  const buildings = await listBuildings();
  return buildings.find((b) => b.id === id)?.name ?? id;
}
