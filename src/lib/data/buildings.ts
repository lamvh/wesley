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
