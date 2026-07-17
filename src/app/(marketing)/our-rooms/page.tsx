import { MarketingPageHeader } from "@/components/shared/marketing-page-header";
import { RoomStyleRow } from "@/components/marketing/room-style-row";
import { getRoomStyles } from "@/lib/mock-data";

export default function OurRoomsPage() {
  const roomStyles = getRoomStyles();
  return (
    <>
      <MarketingPageHeader
        eyebrow="Our rooms"
        title="Three room styles, one caring team"
        intro="A boutique rest home with three styles of room - VIP, premium and comfortable - so you can choose the space that suits. Every room is looked after by the same warm, registered-nurse-led team."
      />
      <section className="mx-auto flex max-w-[1200px] flex-col gap-[26px] px-7 py-[60px]">
        {roomStyles.map((style) => (
          <RoomStyleRow key={style.slot} style={style} />
        ))}
      </section>
    </>
  );
}
