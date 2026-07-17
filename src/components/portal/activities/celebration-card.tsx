import { Photo } from "@/components/shared/photo";

// Featured celebration story: a 3-photo mosaic (1 large + 2 stacked) over a
// gold "Celebration" pill, meta line, headline, and paragraph. Static content.
export function CelebrationCard() {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-cream-2">
      <div className="grid h-[238px] grid-cols-[1.35fr_1fr] gap-1">
        <div className="relative">
          <Photo
            slot="act-podiatry-1"
            alt="Birthday afternoon tea around the table"
          />
        </div>
        <div className="grid grid-rows-2 gap-1">
          <div className="relative">
            <Photo slot="birthday-candles" alt="Making a wish over the candle" />
          </div>
          <div className="relative">
            <Photo
              slot="birthday-portrait"
              alt="Birthday portrait with cake"
            />
          </div>
        </div>
      </div>
      <div className="px-5 py-[18px]">
        <div className="flex items-center gap-[10px]">
          <span className="rounded-full bg-gold-tint px-[11px] py-[5px] text-[12px] font-bold text-gold-text">
            Celebration
          </span>
          <span className="text-[12.5px] text-ink-faint">
            Yesterday · Kōwhai lounge
          </span>
        </div>
        <h3 className="mt-3 font-serif text-[22px] font-semibold text-ink">
          Mei Lam turned 90 - and the whole wing came
        </h3>
        <p className="mt-2 text-[14.5px] leading-[1.62] text-ink-soft">
          The Kōwhai wing gathered for afternoon tea and tiramisu cake from The
          Gateau House. Mei blew out her candle to a rousing waiata, surrounded
          by her table friends and plenty of photos for the whānau.
        </p>
      </div>
    </div>
  );
}
