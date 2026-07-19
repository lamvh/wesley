import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { RoomStyleRow } from "@/components/marketing/room-style-row";
import { getSiteContent } from "@/lib/data/site-content";
import { CARE_SLOTS } from "@/lib/mock-data/site-content-defaults";

export default async function OurRoomsPage() {
  const c = await getSiteContent();
  const roomStyles = c.careLevels.map((r, i) => ({ ...r, slot: CARE_SLOTS[i] }));
  return (
    <>
      <MarketingPageHeader
        eyebrow="Our rooms"
        title={c.care.h1}
        intro={c.care.intro}
      />
      <section className="mx-auto flex max-w-[1200px] flex-col gap-[26px] px-7 py-[60px]">
        {roomStyles.map((style) => (
          <RoomStyleRow key={style.slot} style={style} />
        ))}
      </section>
    </>
  );
}
