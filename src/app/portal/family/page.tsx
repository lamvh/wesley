import { getFamilyFeed, getMessages, getVisits } from "@/lib/mock-data";
import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { Button } from "@/components/ui/button";
import { FamilyPost } from "@/components/portal/family/family-post";
import { VisitRow } from "@/components/portal/family/visit-row";
import { MessageRow } from "@/components/portal/family/message-row";

// Family portal: whānau-facing feed of staff updates, with upcoming visits
// and messages in a sidebar. Read-only this phase; post button is inert.
export default function FamilyPortalPage() {
  const feed = getFamilyFeed();
  const visits = getVisits();
  const messages = getMessages();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Family portal"
        sub="Updates, visits & messages shared with whānau"
        actions={
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            + Post an update
          </Button>
        }
      />

      <div className="mt-[22px] grid grid-cols-[1.6fr_1fr] gap-4 max-lg:grid-cols-1">
        <div className="flex flex-col gap-[14px]">
          {feed.map((post) => (
            <FamilyPost key={post.resident} post={post} />
          ))}
        </div>

        <div className="flex flex-col gap-[14px]">
          <section className="rounded-2xl border border-line bg-cream-2 p-5">
            <h2 className="font-serif text-[19px] font-semibold text-ink">Upcoming visits</h2>
            <div className="mt-3 flex flex-col">
              {visits.map((visit) => (
                <VisitRow key={visit.who} visit={visit} />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-cream-2 p-5">
            <h2 className="font-serif text-[19px] font-semibold text-ink">Messages</h2>
            <div className="mt-3 flex flex-col">
              {messages.map((message) => (
                <MessageRow key={message.from} message={message} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
