import Link from "next/link";
import { Photo } from "@/components/shared/photo";
import { getRoomStyles } from "@/lib/mock-data";

// Cream band: section header + three compact room-style cards.
export function CareLevelsSection() {
  const roomStyles = getRoomStyles();
  return (
    <section className="border-y border-line bg-cream-2">
      <div className="mx-auto max-w-[1200px] px-7 py-[82px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
              Our rooms
            </div>
            <h2 className="mt-[14px] font-serif text-[40px] font-medium tracking-[-0.3px]">
              Three room styles, one caring team
            </h2>
          </div>
          <p className="max-w-[340px] text-[15.5px] leading-[1.65] text-ink-muted">
            Choose the room that suits you best — whichever you pick, the same
            warm, registered-nurse-led team looks after you.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-md:grid-cols-1">
          {roomStyles.map((room) => (
            <div
              key={room.name}
              className="flex flex-col overflow-hidden rounded-[18px] border border-line bg-cream"
            >
              <div className="relative h-[150px]">
                <Photo slot={room.slot} alt={room.name} placeholder={room.name} />
              </div>
              <div className="flex flex-1 flex-col p-5 pb-[22px]">
                <div className="text-[11.5px] font-bold uppercase tracking-[1.4px] text-bronze">
                  {room.wing}
                </div>
                <h3 className="mt-[6px] font-serif text-[23px] font-semibold">
                  {room.name}
                </h3>
                <p className="mb-4 mt-[9px] flex-1 text-[14.5px] leading-[1.6] text-ink-muted">
                  {room.desc}
                </p>
                <Link
                  href="/our-rooms"
                  className="text-[14px] font-semibold text-bronze-text"
                >
                  Learn more ›
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
