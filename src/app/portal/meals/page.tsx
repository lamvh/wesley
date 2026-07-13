import { PortalPageHeader } from "@/components/shared/portal-page-header";
import { DietTile } from "@/components/portal/meals/diet-tile";
import { MealCard } from "@/components/portal/meals/meal-card";
import { Button } from "@/components/ui/button";
import { getDiets, getMeals } from "@/lib/mock-data";

// Today's kitchen sheet: three meal services + dietary-requirement roll-up.
export default function MealsPage() {
  const meals = getMeals();
  const diets = getDiets();

  return (
    <div className="mx-auto max-w-[1180px]">
      <PortalPageHeader
        title="Meals & dietary"
        sub="Today's menu · Saturday, 11 July"
        actions={
          <Button className="h-auto rounded-[11px] bg-navy px-4 py-[9px] text-[14px] font-semibold text-cream hover:bg-navy/90">
            Print kitchen sheet
          </Button>
        }
      />

      <div className="mt-[22px] grid grid-cols-1 gap-4 md:grid-cols-3">
        {meals.map((meal) => (
          <MealCard key={meal.meal} meal={meal} />
        ))}
      </div>

      <section className="mt-4 rounded-[16px] border border-line bg-cream-2 p-[22px]">
        <h2 className="font-serif text-[20px] font-semibold text-ink">
          Dietary requirements today
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-[14px] sm:grid-cols-3 lg:grid-cols-5">
          {diets.map((diet) => (
            <DietTile key={diet.label} diet={diet} />
          ))}
        </div>
      </section>
    </div>
  );
}
