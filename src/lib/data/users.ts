import { createClient } from "@/lib/supabase/server";
import type { User, UserRole, UserStatus } from "@/types/domain";

// Avatar accents cycled by row order (the DB has no colour column).
const PALETTE = [
  "#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#c08a3e",
  "#9a7b4f", "#7e9b6a", "#b06a5a", "#6e879e",
];

function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function relative(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString();
}

const SELECT = "name, username, email, role_id, scope, building_id, status, last_active_at";

function toUsers(
  rows: {
    name: string;
    username: string;
    email: string | null;
    role_id: string;
    scope: string | null;
    building_id: string | null;
    status: string;
    last_active_at: string | null;
  }[],
): User[] {
  return rows.map((r, i) => ({
    name: r.name,
    username: r.username,
    email: r.email ?? "",
    role: r.role_id as UserRole,
    scope: r.scope ?? "-",
    buildingId: r.building_id ?? "wesley",
    status: r.status as UserStatus,
    last: relative(r.last_active_at),
    initials: initialsOf(r.name),
    color: PALETTE[i % PALETTE.length],
  }));
}

// Loads active app_users (not soft-deleted) for the Users & access screen.
export async function listAppUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return toUsers(data);
}

// Soft-deleted accounts, for the "Removed" view where an admin can recover them.
export async function listRemovedAppUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(SELECT)
    .not("deleted_at", "is", null)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return toUsers(data);
}
