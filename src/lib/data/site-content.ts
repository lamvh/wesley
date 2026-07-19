import { createClient } from "@/lib/supabase/server";
import {
  SITE_CONTENT_DEFAULTS,
  type SiteContent,
} from "@/lib/mock-data/site-content-defaults";

// Website CMS read side. The marketing pages call this instead of static copy.
// The DB holds a single `site_content` row whose `content` jsonb is a PARTIAL
// override (only the fields an admin has edited); everything else falls back to
// the code defaults via a deep merge. Public pages read it anonymously (RLS
// allows anon select), so an unset/empty override just renders the defaults.

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Deep-merge `override` onto `base`: nested objects merge key-by-key; arrays and
// primitives from the override replace the base value wholesale (a CMS array
// edit replaces the whole list, which keeps the merge predictable).
function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override === undefined ? base : (override as T));
  }
  const out: Record<string, unknown> = { ...base };
  for (const [key, oval] of Object.entries(override)) {
    if (oval === undefined) continue;
    const bval = (base as Record<string, unknown>)[key];
    out[key] = isPlainObject(bval) && isPlainObject(oval)
      ? deepMerge(bval, oval)
      : oval;
  }
  return out as T;
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_content")
      .select("content")
      .eq("id", "site")
      .maybeSingle();
    if (error || !data?.content) return SITE_CONTENT_DEFAULTS;
    return deepMerge(SITE_CONTENT_DEFAULTS, data.content);
  } catch {
    // Never let a CMS/DB hiccup break the public marketing site.
    return SITE_CONTENT_DEFAULTS;
  }
}
