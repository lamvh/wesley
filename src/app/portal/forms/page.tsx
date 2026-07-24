import { getFormTemplates } from "@/lib/data/forms";
import { FormsView } from "@/components/portal/forms/forms-view";

// Admin-only forms library: blank form templates grouped by category.
export default async function FormsPage() {
  const templates = await getFormTemplates();
  return <FormsView templates={templates} />;
}
