import { AnnouncementBar } from "@/components/marketing/announcement-bar";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";
import { getSiteContent } from "@/lib/data/site-content";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <AnnouncementBar />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter blurb={content.footer.blurb} />
    </div>
  );
}
