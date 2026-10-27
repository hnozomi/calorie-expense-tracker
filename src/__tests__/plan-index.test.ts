import { describe, expect, it } from "vitest";
import {
  buildPlanIndex,
  EMPTY_TOTALS,
  rateDayCalories,
} from "@/components/features/plan/utils/plan-index";
import { createPlan } from "./helpers/weekly-plans";

describe("buildPlanIndex", () => {
  it("S-07: plans are grouped by their cell (day and meal), in order", () => {
    const first = createPlan({
      id: "a",
      date: "2026-10-19",
      mealType: "lunch",
    });
    const second = createPlan({
      id: "b",
      date: "2026-10-19",
      mealType: "lunch",
    });
    const other = createPlan({
      id: "c",
      date: "2026-10-20",
      mealType: "lunch",
    });

    const { plansBySlot } = buildPlanIndex([first, other, second]);

    expect(plansBySlot.get("2026-10-19:lunch")?.map((plan) => plan.id)).toEqual(
      ["a", "b"],
    );
    expect(plansBySlot.get("2026-10-20:lunch")?.map((plan) => plan.id)).toEqual(
      ["c"],
    );
    expect(plansBySlot.get("2026-10-19:dinner")).toBeUndefined();
  });

  it("S-07: each day adds up the calories, PFC and cost of its plans", () => {
    const { totalsByDate } = buildPlanIndex([
      createPlan({
        date: "2026-10-19",
        mealType: "breakfast",
        calories: 400,
        protein: 10,
        fat: 5,
        carbs: 50,
        estimatedCost: 200,
      }),
      createPlan({
        date: "2026-10-19",
        mealType: "dinner",
        calories: 700,
        protein: 30,
        fat: 20,
        carbs: 80,
        estimatedCost: 650,
      }),
    ]);

    expect(totalsByDate.get("2026-10-19")).toEqual({
      calories: 1100,
      protein: 40,
      fat: 25,
      carbs: 130,
      cost: 850,
    });
  });

  it("S-07: a week with no plans has no cells and no totals", () => {
    const { plansBySlot, totalsByDate } = buildPlanIndex([]);
    expect(plansBySlot.size).toBe(0);
    expect(totalsByDate.size).toBe(0);
  });

  it("S-07: EMPTY_TOTALS is all zero and is not changed by adding up", () => {
    buildPlanIndex([createPlan({ calories: 999 })]);
    expect(EMPTY_TOTALS).toEqual({
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      cost: 0,
    });
  });
});

// The day's total in the grid: red over the target, amber under 80% of it, and a bar against the largest day
describe("rateDayCalories", () => {
  it("S-07: a day over the target is over, and a day at the target is not", () => {
    expect(rateDayCalories(2001, 2000, 2001)).toMatchObject({
      isOver: true,
      isLow: false,
    });
    expect(rateDayCalories(2000, 2000, 2000)).toMatchObject({
      isOver: false,
      isLow: false,
    });
  });

  it("S-07: a planned day under 80% of the target is low, and a day at 80% is not", () => {
    expect(rateDayCalories(1599, 2000, 2000)).toMatchObject({
      isOver: false,
      isLow: true,
    });
    expect(rateDayCalories(1600, 2000, 2000)).toMatchObject({
      isOver: false,
      isLow: false,
    });
  });

  it("S-07: a day with nothing planned (0 kcal) is neither over nor low", () => {
    expect(rateDayCalories(0, 2000, 1500)).toEqual({
      isOver: false,
      isLow: false,
      intensity: 0,
    });
  });

  it("S-07: without a target (0), no day is over or low, and the bar still shows", () => {
    expect(rateDayCalories(3000, 0, 4000)).toEqual({
      isOver: false,
      isLow: false,
      intensity: 0.75,
    });
    expect(rateDayCalories(100, 0, 4000)).toMatchObject({
      isOver: false,
      isLow: false,
    });
  });

  it("S-07: the bar is the day's share of the largest day of the week", () => {
    expect(rateDayCalories(500, 2000, 2000).intensity).toBe(0.25);
    expect(rateDayCalories(2000, 2000, 2000).intensity).toBe(1);
  });

  it("S-07: a week with no calories (maxCalories 0) has an empty bar instead of dividing by zero", () => {
    expect(rateDayCalories(0, 2000, 0).intensity).toBe(0);
  });
});
