import { createClient } from "@/lib/supabase/server";
import type { PortalRole } from "@/types/domain";

// The app_users row backing the signed-in person (subset used by the shell).
export interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  role_id: string; // super_admin|admin|nurse|carer|activities|family
  building_id: string | null;
  scope: string | null;
  status: string; // Active|Invited|Suspended
}

export interface CurrentUser {
  authId: string;
  email: string;
  /** The assigned account, or null when signed in but not provisioned. */
  appUser: AppUserRecord | null;
  /**
   * Whether the app_users lookup actually ran. false = the table/infra isn't
   * available yet (pre-migration) or the query errored - callers should fail
   * OPEN in that case so the portal isn't bricked before the schema is applied.
   */
  provisioningReady: boolean;
}

// Reads the signed-in user + their app_users assignment. Returns null only when
// nobody is signed in (middleware already redirects those to /login).
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("app_users")
      .select("id, name, email, role_id, building_id, scope, status")
      .eq("auth_id", user.id)
      .maybeSingle();

    if (error) {
      // Table missing (pre-migration) or transient - fail open, don't lock out.
      return {
        authId: user.id,
        email: user.email ?? "",
        appUser: null,
        provisioningReady: false,
      };
    }

    return {
      authId: user.id,
      email: user.email ?? "",
      appUser: (data as AppUserRecord) ?? null,
      provisioningReady: true,
    };
  } catch {
    // Never let an auth/network error crash the portal - fail open.
    return null;
  }
}

// True when the person may enter the portal: either infra isn't ready yet
// (transition) or they have an active assignment.
export function canAccessPortal(me: CurrentUser | null): boolean {
  if (!me) return false;
  if (!me.provisioningReady) return true; // pre-migration fail-open
  return me.appUser !== null && me.appUser.status !== "Suspended";
}

// Bridges the 6 DB roles onto the shell's current admin|staff switch until the
// nav is fully permission-driven. super_admin/admin → admin; everyone else → staff.
export function toPortalRole(roleId: string | null | undefined): PortalRole {
  return roleId === "super_admin" || roleId === "admin" ? "admin" : "staff";
}
