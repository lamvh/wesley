import type { DietCount, MealService } from "@/types/domain";

const meals: MealService[] = [
  {
    meal: "Breakfast",
    time: "7:30 – 9:00am",
    items: [
      { name: "Porridge with brown sugar", note: "Soft option available" },
      { name: "Scrambled eggs & toast", note: "GF bread on request" },
      { name: "Seasonal fruit & yoghurt", note: "Puree available" },
    ],
  },
  {
    meal: "Lunch",
    time: "12:00 – 1:00pm",
    items: [
      { name: "Roast chicken & vegetables", note: "Soft & puree prepared" },
      { name: "Pumpkin soup & fresh bread", note: "Vegetarian · GF" },
      { name: "Apple crumble & custard", note: "Diabetic option: fruit" },
    ],
  },
  {
    meal: "Dinner",
    time: "5:00 – 6:00pm",
    items: [
      { name: "Shepherd’s pie", note: "Soft · thickened gravy" },
      { name: "Grilled fish & salad", note: "Finger-food plate available" },
      { name: "Trifle", note: "Sugar-free option" },
    ],
  },
];

const diets: DietCount[] = [
  { label: "Soft / puree", count: 9 },
  { label: "Diabetic", count: 7 },
  { label: "Gluten free", count: 4 },
  { label: "Vegetarian", count: 3 },
  { label: "Thickened", count: 5 },
];

export function getMeals(): MealService[] {
  return meals;
}

export function getDiets(): DietCount[] {
  return diets;
}
