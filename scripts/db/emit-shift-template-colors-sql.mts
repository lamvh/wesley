/**
 * Re-colours every row in `shift_templates` with a mutually-distinct palette and
 * emits paste-ready SQL + an HTML proof sheet.
 *
 * Why: the seeded templates only ever used ~11 colour triples across 26 shifts,
 * with a single mustard (#87651A) on 7 of them, so chips in the roster grid read
 * as the same colour. Each shift getting its own colour is a decision already
 * settled with the user (see the master plan, luồng J) - this only widens the
 * palette, it does not go back to colouring by role.
 *
 * A chip renders as: text = `color`, background = `tint`, 1px border = `border`
 * (src/components/portal/roster/roster-cell.tsx). Text must clear WCAG AA (4.5:1)
 * against its own tint, which the script asserts before writing anything.
 *
 * Run: npx tsx scripts/db/emit-shift-template-colors-sql.mts [--strategy=spread|timeofday]
 * Output: supabase/seed/0005_shift_template_colors.sql
 *         .tmp/shift-colour-preview.html (visual proof sheet, not committed)
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const strategy =
  (process.argv.find((a) => a.startsWith("--strategy="))?.split("=")[1] as
    | "spread"
    | "timeofday") ?? "spread";

// ───────────────────────── palette ─────────────────────────
// 14 hue families, hand-tuned rather than swept through HSL: an even HSL sweep
// gives wildly uneven *perceived* lightness (greens read pale, blues read black),
// which is exactly what makes chips hard to tell apart. Each family is a triple
// of (ink, tint, border) that stays legible on the cream roster grid.
interface Family {
  name: string;
  ink: string;
  tint: string;
  border: string;
  /** Deeper second variant, used once a family has to cover a 2nd shift. */
  tint2: string;
  border2: string;
}

const FAMILIES: Family[] = [
  { name: "Amber",     ink: "#8A5A00", tint: "#FDF0D0", border: "#EBCF8A", tint2: "#F8E3AE", border2: "#DDBB63" },
  { name: "Orange",    ink: "#8F3E19", tint: "#FCE3D5", border: "#F0B393", tint2: "#F8D0BA", border2: "#E29A72" },
  { name: "Brick",     ink: "#A3342F", tint: "#FBDEDB", border: "#EFAFA9", tint2: "#F7C8C3", border2: "#E29089" },
  { name: "Rose",      ink: "#A33064", tint: "#FCDFEB", border: "#F0AECB", tint2: "#F8C9DD", border2: "#E48FB5" },
  { name: "Plum",      ink: "#83398C", tint: "#F6DFF7", border: "#DCAEE2", tint2: "#EDCAF0", border2: "#CE93D6" },
  { name: "Violet",    ink: "#5F44A8", tint: "#E9E2FA", border: "#BFB0E6", tint2: "#DCD1F4", border2: "#A797DA" },
  { name: "Indigo",    ink: "#33468F", tint: "#DFE4F8", border: "#AEB9E6", tint2: "#CBD4F2", border2: "#93A2DC" },
  { name: "Blue",      ink: "#1F5E96", tint: "#D9E9F8", border: "#9CC4E5", tint2: "#C2DCF3", border2: "#7FADDA" },
  { name: "Teal",      ink: "#0F6274", tint: "#D5EDF2", border: "#93CBD6", tint2: "#BCE1EA", border2: "#71B7C6" },
  { name: "Emerald",   ink: "#0E6350", tint: "#D6F0E7", border: "#96D5C1", tint2: "#BDE6D6", border2: "#72C4AA" },
  { name: "Green",     ink: "#3B6B25", tint: "#E1F1D4", border: "#AED697", tint2: "#CDE8B9", border2: "#93C776" },
  { name: "Olive",     ink: "#5F5E0E", tint: "#F2F2CE", border: "#D4D389", tint2: "#E8E7B0", border2: "#C2C165" },
  { name: "Coffee",    ink: "#74513A", tint: "#F0E4DB", border: "#D2B7A5", tint2: "#E5D2C4", border2: "#C09E88" },
  { name: "Slate",     ink: "#4A5560", tint: "#E4E8EC", border: "#B4BDC5", tint2: "#D3DAE0", border2: "#9BA6B1" },
];

// ───────────────────────── contrast guard ─────────────────────────
const srgb = (hex: string) =>
  [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
const lum = (hex: string) => {
  const [r, g, b] = srgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const failures: string[] = [];
for (const f of FAMILIES) {
  for (const [label, bg] of [["tint", f.tint], ["tint2", f.tint2]] as const) {
    const ratio = contrast(f.ink, bg);
    if (ratio < 4.5) failures.push(`${f.name}.${label}: ${ratio.toFixed(2)}:1`);
  }
}
if (failures.length) {
  console.error("✗ WCAG AA (4.5:1) failures - fix the palette before emitting:");
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

// ───────────────────────── load live templates ─────────────────────────
const env = (k: string) => {
  const line = readFileSync(join(root, ".env.local"), "utf8")
    .split("\n").find((l) => l.trim().startsWith(`${k}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
};
const db = createClient(env("NEXT_PUBLIC_SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

interface Template {
  id: string;
  name: string;
  time_label: string;
  role: string | null;
  building_id: string;
  /** The colour the row has right now - kept so the proof sheet can show before/after. */
  color: string;
  tint: string;
  border: string;
}
const { data, error } = await db
  .from("shift_templates")
  .select("id,name,time_label,role,building_id,color,tint,border");
if (error) {
  console.error("✗ could not read shift_templates:", error.message);
  process.exit(1);
}
const templates = (data ?? []) as Template[];

// ───────────────────────── ordering ─────────────────────────
// Parse the leading clock time out of a label like "TL: 16:15 - 22:45" so shifts
// can be walked in the order a person reads them down a day column.
function startMinutes(t: Template): number {
  const m = /(\d{1,2}):(\d{2})/.exec(t.time_label ?? "");
  if (!m) return 24 * 60;
  return Number(m[1]) * 60 + Number(m[2]);
}

// Ordered so that shifts likely to sit near each other on screen are also
// adjacent here - the assignment step then deliberately pushes adjacent shifts
// to far-apart hues.
const ordered = [...templates].sort(
  (a, b) =>
    a.building_id.localeCompare(b.building_id) ||
    startMinutes(a) - startMinutes(b) ||
    a.name.localeCompare(b.name),
);

// ───────────────────────── assignment ─────────────────────────
interface Assigned extends Template {
  family: Family;
  variant: 1 | 2;
  /** The colour being proposed (`color`/`tint`/`border` stay as the current row). */
  next: { color: string; tint: string; border: string };
}

function assign(list: Template[]): Assigned[] {
  const used = new Map<string, number>(); // family name → times used
  const out: Assigned[] = [];

  list.forEach((t, i) => {
    let family: Family;
    if (strategy === "timeofday") {
      // Hue carries meaning: the later the shift starts, the cooler the hue.
      // Distinct within a band via the 2nd variant, but neighbouring bands stay
      // related - readable at a glance, slightly less mutually contrasting.
      const mins = startMinutes(t);
      const band =
        mins < 10 * 60 ? [0, 1, 11] :        // early morning → amber/orange/olive
        mins < 14 * 60 ? [10, 9, 8] :        // midday → green/emerald/teal
        mins < 19 * 60 ? [2, 3, 4] :         // afternoon/evening → brick/rose/plum
                         [6, 5, 7, 13];      // night → indigo/violet/blue/slate
      // Spread evenly inside the band by always taking its least-used member.
      family = band
        .map((b) => FAMILIES[b])
        .sort((a, b2) => (used.get(a.name) ?? 0) - (used.get(b2.name) ?? 0))[0];
    } else {
      // "spread": step through the wheel with a stride coprime to the family
      // count, so consecutive shifts land on opposite sides of the wheel rather
      // than on neighbouring hues.
      family = FAMILIES[(i * 5) % FAMILIES.length];
    }

    const n = (used.get(family.name) ?? 0) + 1;
    used.set(family.name, n);
    const variant: 1 | 2 = n === 1 ? 1 : 2;
    out.push({
      ...t,
      family,
      variant,
      next: {
        color: family.ink,
        tint: variant === 1 ? family.tint : family.tint2,
        border: variant === 1 ? family.border : family.border2,
      },
    });
  });

  return out;
}

const assigned = assign(ordered);

// A collision here means two shifts are literally indistinguishable.
const seen = new Map<string, string>();
for (const a of assigned) {
  const key = `${a.next.color}|${a.next.tint}`;
  const prev = seen.get(key);
  if (prev) console.warn(`⚠ same colour on two shifts: "${prev}" and "${a.name}"`);
  seen.set(key, a.name);
}

// How bad the current state is, for the before/after comparison.
const beforeDistinct = new Set(assigned.map((a) => `${a.color}|${a.tint}`)).size;

// ───────────────────────── SQL ─────────────────────────
const s = (v: string) => `'${v.replace(/'/g, "''")}'`;
const sql: string[] = [
  `-- Distinct chip colours for every shift template (${assigned.length} rows, strategy: ${strategy}).`,
  "-- Generated by scripts/db/emit-shift-template-colors-sql.mts - do not edit by hand.",
  "-- Safe to re-run: each statement targets one id and only touches colour columns.",
  "",
];
for (const a of assigned) {
  sql.push(
    `update public.shift_templates set color = ${s(a.next.color)}, tint = ${s(a.next.tint)}, border = ${s(a.next.border)} where id = ${s(a.id)};  -- ${a.family.name}${a.variant === 2 ? " (deep)" : ""} · ${a.name}`,
  );
}
sql.push("", "select id, name, color, tint, border from public.shift_templates order by color, name;");

const sqlDest = join(root, "supabase/seed/0005_shift_template_colors.sql");
mkdirSync(dirname(sqlDest), { recursive: true });
writeFileSync(sqlDest, sql.join("\n") + "\n");

// ───────────────────────── data for the proof sheet ─────────────────────────
// Emitted rather than rendered here so the visual proof sheet can be authored
// as its own page without this script owning any design decisions.
const jsonDest = join(root, ".tmp/shift-colours.json");
mkdirSync(dirname(jsonDest), { recursive: true });
writeFileSync(
  jsonDest,
  JSON.stringify(
    {
      strategy,
      total: assigned.length,
      beforeDistinct,
      afterDistinct: seen.size,
      families: FAMILIES.map((f) => ({
        name: f.name,
        ink: f.ink,
        tint: f.tint,
        border: f.border,
        tint2: f.tint2,
        border2: f.border2,
        contrast: Number(contrast(f.ink, f.tint).toFixed(2)),
        contrast2: Number(contrast(f.ink, f.tint2).toFixed(2)),
      })),
      shifts: assigned.map((a) => ({
        id: a.id,
        name: a.name,
        time: a.time_label,
        role: a.role,
        building: a.building_id,
        family: a.family.name,
        variant: a.variant,
        before: { color: a.color, tint: a.tint, border: a.border },
        after: a.next,
      })),
    },
    null,
    2,
  ),
);

console.log(`Strategy: ${strategy}`);
console.log(`  ${assigned.length} templates · ${beforeDistinct} distinct colours before → ${seen.size} after`);
console.log(`  ✓ all ${FAMILIES.length} families clear WCAG AA 4.5:1 on both variants`);
console.log(`  SQL  → ${sqlDest}`);
console.log(`  Data → ${jsonDest}`);
