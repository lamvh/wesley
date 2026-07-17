import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { ActivityWeek } from "@/components/portal/activities/activity-week";
import { CelebrationCard } from "@/components/portal/activities/celebration-card";
import { HighlightCard } from "@/components/portal/activities/highlight-card";
import { UpcomingBirthdays } from "@/components/portal/activities/upcoming-birthdays";
import { Button } from "@/components/ui/button";
import { getActivityWeek, getBirthdays } from "@/lib/mock-data";

// Recent-highlight gallery cards - static literal content from the design.
const highlights = [
  {
    slot: "act-birthday-cakes",
    alt: "Mobile podiatry visit",
    eyebrow: "Wellbeing · Tue",
    eyebrowClass: "text-navy",
    title: "Podiatry clinic",
  },
  {
    slot: "act-podiatry-2",
    alt: "Foot care and a chat",
    eyebrow: "Wellbeing · Tue",
    eyebrowClass: "text-navy",
    title: "Foot care & a chat",
  },
  {
    slot: "act-podiatry-3",
    alt: "Two birthday cakes with candles",
    eyebrow: "Celebration · Fri",
    eyebrowClass: "text-gold-text",
    title: "Double birthday tea",
  },
  {
    slot: "act-birthday-group",
    alt: "Sunroom wellbeing session",
    eyebrow: "Wellbeing · Wed",
    eyebrowClass: "text-navy",
    title: "Sunroom wellbeing",
  },
];

// Activities hub: featured celebration, upcoming birthdays, recent highlights,
// and the full seven-day programme colour-coded by category.
export default function ActivitiesPage() {
  const week = getActivityWeek();
  const birthdays = getBirthdays();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Activities"
        sub="This week's programme · 7–13 July"
        actions={
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            + Add activity
          </Button>
        }
      />

      <div className="mt-[22px] grid grid-cols-1 gap-4 lg:grid-cols-[1.55fr_1fr]">
        <CelebrationCard />
        <UpcomingBirthdays birthdays={birthdays} />
      </div>

      <div className="mt-[22px] mb-3 flex items-center justify-between">
        <h2 className="font-serif text-[20px] font-semibold text-ink">
          Recent highlights
        </h2>
        <span className="text-[13px] font-semibold text-bronze-text">
          View gallery
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((highlight) => (
          <HighlightCard key={highlight.title} {...highlight} />
        ))}
      </div>

      <ActivityWeek week={week} />
    </div>
  );
}
