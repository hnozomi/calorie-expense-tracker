"use client";

// Client because it reads the week's plans, including the ones still being saved, from the shared context

import { usePlanCalendarGrid } from "@/components/features/plan/hooks/use-plan-calendar-grid";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MEAL_TYPES } from "@/types";
import { PlanGridHeaderRow } from "./plan-grid-header-row";
import { PlanGridLegend } from "./plan-grid-legend";
import { PlanGridMealRow } from "./plan-grid-meal-row";
import { PlanGridTotalsRow } from "./plan-grid-totals-row";

type Props = {
  targetCalories: number;
};

/** Horizontally scrollable 7-day × 4-meal grid with daily calorie totals */
export const PlanCalendarGrid = ({ targetCalories }: Props) => {
  const { days, today, plansBySlot, dayTotals } =
    usePlanCalendarGrid(targetCalories);

  return (
    <>
      <ScrollArea className="w-full">
        <div className="min-w-[640px]">
          <PlanGridHeaderRow days={days} today={today} />
          {MEAL_TYPES.map((mealType) => (
            <PlanGridMealRow
              key={mealType}
              mealType={mealType}
              days={days}
              today={today}
              plansBySlot={plansBySlot}
            />
          ))}
          <PlanGridTotalsRow dayTotals={dayTotals} />
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {targetCalories > 0 && <PlanGridLegend />}
    </>
  );
};
