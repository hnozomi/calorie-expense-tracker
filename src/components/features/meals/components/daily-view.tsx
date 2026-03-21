"use client";

import { useAtomValue } from "jotai";
import { Header, PageContainer } from "@/components/features/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { MEAL_TYPES } from "@/types";
import { useDailyMeals } from "../hooks/use-daily-meals";
import { selectedDateAtom } from "../stores/date-atom";
import { DailySummaryCard } from "./daily-summary-card";
import { DateNavigator } from "./date-navigator";
import { MealRegisterDrawer } from "./meal-register-drawer";
import { MealSlotCard } from "./meal-slot-card";

/** Top-level daily view combining summary, meal slots, and register drawer */
const DailyView = () => {
  const selectedDate = useAtomValue(selectedDateAtom);
  const { data: dailyMeals, isLoading } = useDailyMeals(selectedDate);

  return (
    <>
      <Header title="めしログ" />
      <PageContainer>
        <DateNavigator />
        <DailySummaryCard date={selectedDate} />

        <div className="space-y-3 p-4">
          {isLoading
            ? MEAL_TYPES.map((type) => (
                <Skeleton key={type} className="h-32 rounded-xl" />
              ))
            : MEAL_TYPES.map((type) => (
                <MealSlotCard
                  key={type}
                  mealType={type}
                  items={dailyMeals?.[type]?.items ?? []}
                />
              ))}
        </div>
      </PageContainer>

      <MealRegisterDrawer />
    </>
  );
};

export { DailyView };
