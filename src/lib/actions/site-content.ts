"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Website CMS write side. Edits persist to the single `site_content` override
// row; the read layer (lib/data/site-content.ts) deep-merges it over the code
// defaults. Runs under the signed-in user's session, so the authenticated-write
// RLS policy applies. Marketing routes are revalidated so edits show live.

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
  if (!path) return { error: "Missing field path." };
  const supabase = await createClient();

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
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ id: "site", content: {}, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  revalidateMarketing();
  return {};
}
