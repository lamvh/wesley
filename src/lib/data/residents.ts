import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";
import type { Birthday, Resident } from "@/types/domain";

// Real Supabase-backed resident accessors (replaces the mock for the residents
// screens). Runs under the signed-in user's session, so RLS applies. Rows are
// mapped from snake_case DB columns to the camelCase domain type; presentation
// (care-tier colour) stays derived in the component layer.

const COLUMNS =
  "slug,name,pref,room,age,diet,mobility,gp,avatar,color,note,flags,created_at," +
  "dob,admitted_on,nhi,gender,resident_group,phone";

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
  dob: string | null;
  admitted_on: string | null;
  nhi: string | null;
  gender: string | null;
  resident_group: string | null;
  phone: string | null;
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
    dob: r.dob ?? "",
    admittedOn: r.admitted_on ?? "",
    nhi: r.nhi ?? "",
    gender: r.gender ?? "",
    group: r.resident_group ?? "",
    phone: r.phone ?? "",
  };
}

export async function getResidents(): Promise<Resident[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Failed to load residents: ${error.message}`);
  return (data ?? []).map((r) => toResident(r as unknown as ResidentRow));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** 1 -> "1st", 2 -> "2nd", 90 -> "90th" (11/12/13 stay "th"). */
function ordinal(n: number): string {
  const rest = n % 100;
  if (rest >= 11 && rest <= 13) return `${n}th`;
  const suffix = ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${suffix}`;
}

/**
 * Residents whose birthday falls in the current calendar month, earliest day
 * first. Month/day are read off the ISO dob string rather than parsed into a
 * Date so the result is not shifted by the server's timezone.
 */
export async function getBirthdaysThisMonth(): Promise<Birthday[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .select("name,room,dob,color")
    .not("dob", "is", null);
  if (error) throw new Error(`Failed to load birthdays: ${error.message}`);

  const now = new Date();
  const month = now.getMonth() + 1;
  const today = now.getDate();

  const rows = (data ?? [])
    .map((r) => r as unknown as Pick<ResidentRow, "name" | "room" | "dob" | "color">)
    .filter((r): r is typeof r & { dob: string } => !!r.dob && Number(r.dob.slice(5, 7)) === month)
    .sort((a, b) => Number(a.dob.slice(8, 10)) - Number(b.dob.slice(8, 10)));

  return rows.map((r) => {
    const day = Number(r.dob.slice(8, 10));
    const turning = now.getFullYear() - Number(r.dob.slice(0, 4));
    return {
      name: r.name,
      room: r.room ? `Room ${r.room}` : "",
      date: day === today ? "Today" : `${day} ${MONTHS[month - 1]}`,
      initials: initials(r.name),
      color: r.color ?? "#6E875E",
      badge: ordinal(turning),
    };
  });
}

export async function getResidentBySlug(slug: string): Promise<Resident | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("residents")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load resident ${slug}: ${error.message}`);
  return data ? toResident(data as unknown as ResidentRow) : null;
}
