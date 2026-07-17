import { Photo } from "@/components/shared/photo";

// 2-column welcome: intro copy with tint chips on the left, a 3-tile photo
// collage on the right.
export function WelcomeSection() {
  return (
    <section className="mx-auto grid max-w-[1200px] grid-cols-[1.05fr_.95fr] items-center gap-16 px-7 py-[88px] max-md:grid-cols-1">
      <div>
        <div className="text-[13px] font-bold uppercase tracking-[2px] text-bronze-text">
          Haere mai · Welcome
        </div>
        <h2 className="mt-4 font-serif text-[42px] font-medium leading-[1.1] tracking-[-0.3px]">
          Care that begins with the person, not the paperwork
        </h2>
        <p className="mt-[22px] text-[17px] leading-[1.72] text-ink-muted">
          At Wesley we keep things small on purpose. Our team learns the little
          things - how you take your tea, the crossword you never miss, the
          family who visit on Sundays - because those details are what make a
          place feel like home.
        </p>
        <div className="mt-[26px] flex flex-wrap gap-[10px]">
          <span className="rounded-full bg-sage-tint px-[15px] py-2 text-[14px] font-semibold text-sage">
            Registered nurses on site 24/7
          </span>
          <span className="rounded-full bg-rust-tint px-[15px] py-2 text-[14px] font-semibold text-rust">
            Chef-prepared meals
          </span>
          <span className="rounded-full bg-amber-tint px-[15px] py-2 text-[14px] font-semibold text-cat-move">
            Whānau always welcome
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 grid-rows-[180px_180px] gap-[14px]">
        <div className="relative row-span-2 overflow-hidden rounded-[18px]">
          <Photo slot="vme-w1" alt="A resident with their carer" placeholder="Resident & carer" />
        </div>
        <div className="relative overflow-hidden rounded-[18px]">
          <Photo slot="vme-w2" alt="The garden" placeholder="Garden" />
        </div>
        <div className="relative overflow-hidden rounded-[18px]">
          <Photo slot="vme-w3" alt="The dining room" placeholder="Dining" />
        </div>
      </div>
    </section>
  );
}
