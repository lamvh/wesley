"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/current-user";
import { getFormDownloadUrl } from "@/lib/data/forms";
import { FORM_CATEGORIES, type FormCategory } from "@/lib/forms-constants";

const BUCKET = "form-templates";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/webp",
]);

export interface FormActionState { error?: string }
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Admin guard - mirrors requireAdmin (users.ts) with a forms-specific message.
async function requireFormsAdmin(): Promise<FormActionState | null> {
  const me = await getCurrentUser();
  const role = me?.appUser?.role_id;
  if (role !== "super_admin" && role !== "admin") return { error: "Bạn không có quyền quản lý biểu mẫu." };
  return null;
}

export async function saveFormTemplate(_prev: FormActionState, fd: FormData): Promise<FormActionState> {
  const denied = await requireFormsAdmin();
  if (denied) return denied;

  const id = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return { error: "Tên biểu mẫu là bắt buộc." };
  const category = str(fd, "category") as FormCategory;
  if (!FORM_CATEGORIES.includes(category)) return { error: "Chọn một phân loại hợp lệ." };
  const description = str(fd, "description");

  const file = fd.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!id && !hasFile) return { error: "Chọn một file để tải lên." };
  if (hasFile) {
    if (file.size > MAX_SIZE) return { error: "File vượt quá 10 MB." };
    if (!ALLOWED.has(file.type)) return { error: "Định dạng file không được hỗ trợ." };
  }

  const supabase = await createClient();
  const me = await getCurrentUser();

  // Upload the new file first (so a failed upload never orphans the row).
  let newPath: string | null = null;
  let newName = "";
  if (hasFile) {
    const f = file as File;
    newPath = `${randomUUID()}-${f.name.replace(/[^\w.\-]+/g, "_")}`;
    newName = f.name;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(newPath, f, {
      contentType: f.type,
      upsert: false,
    });
    if (upErr) return { error: `Tải file thất bại: ${upErr.message}` };
  }

  if (id) {
    // Edit: fetch the old path so we can swap the file if a new one was chosen.
    const { data: existing } = await supabase
      .from("form_templates").select("file_path").eq("id", id).maybeSingle();
    const update: Record<string, unknown> = {
      name, category, description: description || null, updated_at: new Date().toISOString(),
    };
    if (newPath) {
      const f = file as File;
      update.file_path = newPath; update.file_name = newName;
      update.mime_type = f.type; update.size_bytes = f.size;
    }
    const { error } = await supabase.from("form_templates").update(update).eq("id", id);
    if (error) { if (newPath) await supabase.storage.from(BUCKET).remove([newPath]); return { error: error.message }; }
    if (newPath && existing?.file_path) await supabase.storage.from(BUCKET).remove([existing.file_path]);
  } else {
    const f = file as File;
    const { error } = await supabase.from("form_templates").insert({
      name, category, description: description || null,
      file_path: newPath, file_name: newName, mime_type: f.type, size_bytes: f.size,
      uploaded_by: me?.appUser?.id ?? null,
    });
    if (error) { if (newPath) await supabase.storage.from(BUCKET).remove([newPath]); return { error: error.message }; }
  }

  revalidatePath("/portal/forms");
  return {};
}

export async function deleteFormTemplate(fd: FormData): Promise<void> {
  const denied = await requireFormsAdmin();
  if (denied) throw new Error(denied.error);
  const id = str(fd, "id");
  if (!id) return;
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("form_templates").select("file_path").eq("id", id).maybeSingle();
  const { error } = await supabase.from("form_templates").delete().eq("id", id);
  if (error) throw new Error(`Xoá biểu mẫu thất bại: ${error.message}`);
  if (row?.file_path) await supabase.storage.from(BUCKET).remove([row.file_path]);
  revalidatePath("/portal/forms");
}

// Returns a fresh signed URL for the client to open in a new tab.
export async function formDownloadUrl(
  _prev: { url?: string; error?: string },
  fd: FormData,
): Promise<{ url?: string; error?: string }> {
  const denied = await requireFormsAdmin();
  if (denied) return { error: denied.error };
  const filePath = str(fd, "filePath");
  if (!filePath) return { error: "Thiếu đường dẫn file." };
  try {
    return { url: await getFormDownloadUrl(filePath) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Không tạo được link tải." };
  }
}
