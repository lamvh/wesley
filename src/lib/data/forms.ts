import { createClient } from "@/lib/supabase/server";
import type { FormTemplate, FormCategory } from "@/lib/forms-constants";

const BUCKET = "form-templates";

export async function getFormTemplates(): Promise<FormTemplate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("form_templates")
    .select("id,name,category,description,file_path,file_name,mime_type,size_bytes,uploaded_by,created_at,updated_at")
    .order("category")
    .order("name");
  if (error) throw new Error(`Failed to load form templates: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category as FormCategory,
    description: r.description ?? "",
    filePath: r.file_path,
    fileName: r.file_name,
    mimeType: r.mime_type ?? "",
    sizeBytes: r.size_bytes != null ? Number(r.size_bytes) : 0,
    uploadedBy: r.uploaded_by ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

// Short-lived signed URL so an admin can open/download a private-bucket file.
export async function getFormDownloadUrl(filePath: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 60);
  if (error || !data) throw new Error(`Failed to sign download URL: ${error?.message}`);
  return data.signedUrl;
}
