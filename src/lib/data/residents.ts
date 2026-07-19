import { createClient } from "@/lib/supabase/server";
import type { Resident } from "@/types/domain";

// Real Supabase-backed resident accessors (replaces the mock for the residents
// screens). Runs under the signed-in user's session, so RLS applies. Rows are
// mapped from snake_case DB columns to the camelCase domain type; presentation
// (care-tier colour) stays derived in the component layer.

const COLUMNS =
  "slug,name,pref,room,age,diet,mobility,gp,avatar,color,note,flags,created_at";

interface ResidentRow {
  slug: string;
  name: string;
  pref: string | null;
  room: string | null;
  age: number | null;
  diet: string | null;
  mobility: string | null;
  gp: string | null;
  avatar: string | null;
  color: string | null;
  note: string | null;
  flags: string[] | null;
}

function toResident(r: ResidentRow): Resident {
  return {
    slug: r.slug,
    name: r.name,
    pref: r.pref ?? "",
    room: r.room ?? "",
    age: r.age ?? 0,
    diet: r.diet ?? "",
    mobility: r.mobility ?? "",
    gp: r.gp ?? "",
    avatar: r.avatar ?? "",
    color: r.color ?? "#6E875E",
    note: r.note ?? "",
    flags: r.flags ?? [],
  };
}

export async function getResidents(): Promise<Resident[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load residents: ${error.message}`);
  return (data ?? []).map((r) => toResident(r as ResidentRow));
}

export async function getResidentBySlug(slug: string): Promise<Resident | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load resident ${slug}: ${error.message}`);
  return data ? toResident(data as ResidentRow) : null;
}
