import { WebsiteCms } from "@/components/portal/website/website-cms";
import { getSiteContent } from "@/lib/data/site-content";

// Website content CMS (admin-only nav entry). Edits the public marketing copy;
// changes persist to `site_content` and the marketing pages read the merged
// result. Loads the current merged content and hands it to the client editor.
export default async function WebsitePage() {
  const content = await getSiteContent();
  return <WebsiteCms initial={content} />;
}
