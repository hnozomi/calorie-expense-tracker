"use client";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MEAL_TYPE_LABELS } from "@/types";
import type { MealPlan } from "../types/meal-plan";
import { PlanCell } from "./plan-cell";

/** Meal types displayed in the calendar (exclude snack for grid simplicity) */
const CALENDAR_MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

type PlanCalendarGridProps = {
  weekStart: string;
  plans: MealPlan[];
};

/** Build 7 days starting from weekStart */
const buildWeekDays = (weekStart: string) => {
  const days: { date: string; label: string; dayOfWeek: string }[] = [];
  const weekDays = "日月火水木金土";
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push({
      date: `${y}-${m}-${day}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      dayOfWeek: weekDays[d.getDay()],
    });
  }
  return days;
};

/** Horizontally scrollable 7-day × 3-meal grid */
const PlanCalendarGrid = ({ weekStart, plans }: PlanCalendarGridProps) => {
  const days = buildWeekDays(weekStart);

  /** Get plans for a specific date and meal type */
  const getPlans = (date: string, mealType: string) =>
    plans.filter((p) => p.date === date && p.mealType === mealType);

  return (
    <ScrollArea className="w-full">
      <div className="min-w-[640px]">
        {/* Header row: day labels */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b">
          <div className="p-1" />
          {days.map((day) => (
            <div key={day.date} className="p-1 text-center">
              <p className="text-xs text-muted-foreground">{day.dayOfWeek}</p>
              <p className="text-sm font-medium">{day.label}</p>
            </div>
          ))}
        </div>

        {/* Meal type rows */}
        {CALENDAR_MEAL_TYPES.map((mealType) => (
          <div
            key={mealType}
            className="grid grid-cols-[56px_repeat(7,1fr)] border-b"
          >
            <div className="flex items-center justify-center border-r p-1">
              <span className="text-xs font-medium text-muted-foreground">
                {MEAL_TYPE_LABELS[mealType]}
              </span>
            </div>
            {days.map((day) => (
              <div
                key={`${day.date}-${mealType}`}
                className="border-r last:border-r-0"
              >
                <PlanCell
                  date={day.date}
                  mealType={mealType}
                  plans={getPlans(day.date, mealType)}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export { PlanCalendarGrid };
