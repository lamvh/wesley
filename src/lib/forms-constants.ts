// Fixed form-template categories (single source of truth for the enum). Changing
// this set also requires updating the check constraint in a new migration.
export const FORM_CATEGORIES = [
  "Admission & discharge",
  "Care plan",
  "Clinical & assessment",
  "Consent",
  "Incident & risk",
  "Medication",
  "HR & staff",
  "Policy & procedure",
  "Other",
] as const;

export type FormCategory = (typeof FORM_CATEGORIES)[number];

// One blank form template in the library. File itself lives in the
// `form-templates` Storage bucket at `filePath`.
export interface FormTemplate {
  id: string;
  name: string;
  category: FormCategory;
  description: string;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
