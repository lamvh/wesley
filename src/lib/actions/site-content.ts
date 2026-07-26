"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/actions/users";

// Website CMS write side. Edits persist to the single `site_content` override
// row; the read layer (lib/data/site-content.ts) deep-merges it over the code
// defaults. Marketing routes are revalidated so edits show live.
//
// ADMIN ONLY. These actions change the PUBLIC marketing site, so they are gated
// the same way as the other privileged actions: requireAdmin() first, then the
// service-role client. `site_content` no longer carries a write policy for
// regular sessions (migration 0026), so that check is the only door - hiding the
// nav item behind `adminOnly` was concealment, not enforcement, and calling the
// server action directly went straight through it.
const DENIED = "Chỉ quản trị viên mới sửa được nội dung website.";

const MARKETING_PATHS = [
  "/",
  "/our-rooms",
  "/life-here",
  "/our-home",
  "/careers",
  "/contact",
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Set a dotted path on a copy of `root`, creating intermediate objects as
// needed. Array sections are always saved wholesale (path = section name, value
// = the full array), so this only ever walks object keys.
function setPath(
  root: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = path.split(".");
  const out = { ...root };
  let node = out;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const child = node[key];
    node[key] = isPlainObject(child) ? { ...child } : {};
    node = node[key] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
  return out;
}

function revalidateMarketing() {
  for (const p of MARKETING_PATHS) revalidatePath(p);
  revalidatePath("/portal/website");
}

// Persist one CMS field (dotted path, e.g. "hero.h1" or "contact.email"); for
// array sections pass the section name and the whole array as `value`.
export async function saveSiteContent(
  path: string,
  value: unknown,
): Promise<{ error?: string }> {
  if (await requireAdmin()) return { error: DENIED };
  if (!path) return { error: "Missing field path." };
  const supabase = createAdminClient();

  const { data, error: readErr } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", "site")
    .maybeSingle();
  if (readErr) return { error: readErr.message };

  const current = isPlainObject(data?.content) ? data!.content : {};
  const next = setPath(current, path, value);

  const { error } = await supabase
    .from("site_content")
    .upsert({ id: "site", content: next, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  revalidateMarketing();
  return {};
}

// Clear all overrides — the site falls back to the code defaults.
export async function resetSiteContent(): Promise<{ error?: string }> {
  if (await requireAdmin()) return { error: DENIED };
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ id: "site", content: {}, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidateMarketing();
  return {};
}
