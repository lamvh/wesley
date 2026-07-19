import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client. Bypasses RLS - SERVER-ONLY. Never import this
// from a "use client" module. Used for admin user creation and for resolving a
// login identifier to an account before a session exists (anonymous users
// cannot read app_users under RLS).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase URL / service role key missing from server env");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
