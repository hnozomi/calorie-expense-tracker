"use client";
// Client because it shows the day's items including the ones still being saved (useOptimistic)

import { MEAL_TYPES } from "@/types";
import { useDailyMealsContext } from "../hooks/use-daily-meals-context";
import { MealSlotCard } from "./meal-slot-card";

export const MealSlotList = () => {
  const { meals } = useDailyMealsContext();
  return (
    <div className="space-y-2.5 px-4 pt-4 pb-4">
      {MEAL_TYPES.map((type) => (
        <MealSlotCard key={type} mealType={type} items={meals[type]} />
      ))}
    </div>
  );
};
