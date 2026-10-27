import { describe, expect, it } from "vitest";
import {
  buildPlanIndex,
  EMPTY_TOTALS,
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

  it("a week with no plans has no cells and no totals", () => {
    const { plansBySlot, totalsByDate } = buildPlanIndex([]);
    expect(plansBySlot.size).toBe(0);
    expect(totalsByDate.size).toBe(0);
  });

  it("EMPTY_TOTALS is all zero and is not changed by adding up", () => {
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
