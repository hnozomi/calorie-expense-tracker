"use client";

import { usePrefetchQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { getNutritionTargetQueryOptions } from "@/components/features/settings/queries";
import { useSupabase } from "@/hooks";
import { MEAL_TYPES } from "@/types";
import { useDailyMeals } from "../hooks/use-daily-meals";
import { getDailySummaryQueryOptions } from "../queries";
import { selectedDateAtom } from "../stores/date-atom";
import { DailySkeleton } from "./daily-skeleton";
import { DailySummaryCard } from "./daily-summary-card";
import { DateNavigator } from "./date-navigator";
import { MealRegisterDrawer } from "./meal-register-drawer";
import { MealSlotCard } from "./meal-slot-card";

// True after the first client mount; the hydration gate below only needs to
// run once per page load, not on every tab navigation back to this view
let hasHydratedOnce = false;

/** Top-level daily view combining summary, meal slots, and register drawer */
const DailyView = () => {
  const [isMounted, setIsMounted] = useState(hasHydratedOnce);
  useEffect(() => {
    hasHydratedOnce = true;
    setIsMounted(true);
  }, []);

  const selectedDate = useAtomValue(selectedDateAtom);
  const supabase = useSupabase();

  // Warm the queries used by DailySummaryCard before useDailyMeals suspends,
  // so all three requests run in parallel instead of as a waterfall
  usePrefetchQuery(getDailySummaryQueryOptions(supabase, selectedDate));
  usePrefetchQuery(getNutritionTargetQueryOptions(supabase));

  const { data: dailyMeals } = useDailyMeals(selectedDate);

  if (!isMounted) return <DailySkeleton />;

  return (
    <>
      <Header title="めしログ" />
      <PageContainer>
        <DateNavigator />
        <DailySummaryCard date={selectedDate} />

        <div className="space-y-2.5 px-4 pt-4 pb-4">
          {MEAL_TYPES.map((type) => (
            <MealSlotCard
              key={type}
              mealType={type}
              items={dailyMeals[type].items}
            />
          ))}
        </div>
      </PageContainer>

      <MealRegisterDrawer />
    </>
  );
};

export { DailyView };
