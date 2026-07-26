"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify, initials } from "@/lib/utils";
import { getRoomNumbers } from "@/lib/data/rooms";

const BUILDING = "wesley";

// Avatar palette (mirrors the person colours used across the mock data). A new
// resident gets a stable colour derived from their name.
const PALETTE = [
  "#6E875E", "#BE7350", "#8a6ba3", "#5b8f9a", "#b06a5a",
  "#c08a3e", "#7e9b6a", "#6e879e", "#9a7b4f",
];
function pickColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h + ch.charCodeAt(0)) % PALETTE.length;
  return PALETTE[h];
}

export interface ResidentFormState {
  error?: string;
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

// Create (no slug) or update (hidden slug) a resident. Runs under the signed-in
// user's session, so RLS (residents_write, authenticated) governs the write.
export async function saveResident(
  _prev: ResidentFormState,
  formData: FormData,
): Promise<ResidentFormState> {
  const existingSlug = str(formData, "slug");
  const name = str(formData, "name");
  if (!name) return { error: "Name is required." };

  // Validated against the REAL room register of the home this resident belongs
  // to, not the mock numbers - a resident must sit in a room that home has, and
  // the two homes' registers do not overlap (Wesley has no 1B).
  const room = str(formData, "room");
  const buildingId = str(formData, "buildingId") || BUILDING;
  if (!(await getRoomNumbers(buildingId)).includes(room)) {
    return { error: "Please choose a room." };
  }

  // NZ National Health Index: 3 letters then 4 characters (older numbers end in
  // a digit, post-2022 ones in a letter). Stored uppercase so the uniqueness
  // index can't be sidestepped by case.
  const nhi = str(formData, "nhi").toUpperCase();
  if (nhi && !/^[A-Z]{3}[0-9]{3}[0-9A-Z]$/.test(nhi)) {
    return { error: "NHI phải có dạng 3 chữ cái + 4 ký tự, ví dụ ABC1234." };
  }

  const ageRaw = str(formData, "age");
  const age = ageRaw ? Number(ageRaw) : null;
  if (ageRaw && (!Number.isInteger(age) || age! < 0 || age! > 130)) {
    return { error: "Age must be a whole number between 0 and 130." };
  }

  const flags = str(formData, "flags")
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);

  const fields = {
    name,
    pref: str(formData, "pref") || null,
    room,
    age,
    diet: str(formData, "diet") || null,
    mobility: str(formData, "mobility") || null,
    gp: str(formData, "gp") || null,
    note: str(formData, "note") || null,
    flags,
    avatar: initials(name),
    dob: str(formData, "dob") || null,
    admitted_on: str(formData, "admittedOn") || null,
    nhi: nhi || null,
    gender: str(formData, "gender") || null,
    resident_group: str(formData, "group") || null,
    phone: str(formData, "phone") || null,
  };

  const supabase = await createClient();
  let slug = existingSlug;

  if (existingSlug) {
    const { error } = await supabase
      .from("residents")
      .update(fields)
      .eq("slug", existingSlug);
    // The NHI uniqueness index can trip here too, not just on insert.
    if (error) {
      return {
        error:
          error.code === "23505" && error.message.includes("nhi")
            ? "Số NHI này đã có resident khác dùng."
            : error.message,
      };
    }
  } else {
    slug = slugify(name);
    // `residents` is only unique on (building_id, slug), but every read and
    // write here keys on the slug alone - so the same slug existing in the
    // other home would make one edit hit two records. Reject the name instead.
    const { data: clash } = await supabase
      .from("residents")
      .select("building_id")
      .eq("slug", slug)
      .limit(1);
    if (clash?.length) {
      return { error: "A resident with this name already exists." };
    }
    const { error } = await supabase.from("residents").insert({
      ...fields,
      slug,
      building_id: buildingId,
      color: pickColor(name),
    });
    if (error) {
      return {
        error:
          error.code === "23505"
            ? error.message.includes("nhi")
              ? "Số NHI này đã có resident khác dùng."
              : "A resident with this name already exists."
            : error.message,
      };
    }
  }

  revalidatePath("/portal/residents");
  revalidatePath(`/portal/residents/${slug}`);
  redirect(`/portal/residents/${slug}`);
}

export async function deleteResident(formData: FormData): Promise<void> {
  const slug = str(formData, "slug");
  if (!slug) return;
  const supabase = await createClient();
  const { error } = await supabase.from("residents").delete().eq("slug", slug);
  if (error) throw new Error(`Failed to remove resident: ${error.message}`);
  revalidatePath("/portal/residents");
  redirect("/portal/residents");
}
