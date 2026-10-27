import { describe, expect, it } from "vitest";
import { toNutritionTarget } from "@/components/features/settings/utils/to-nutrition-target";

// The home summary compares the day with the user's targets (settings/api/queries.ts, ui-tech §phase 2)

describe("toNutritionTarget", () => {
  it("S-01: before any targets are saved, the defaults of 03-db-design (2000 kcal, P60, F55, C300) are used", () => {
    expect(toNutritionTarget(null)).toEqual({
      id: "",
      userId: "",
      targetCalories: 2000,
      targetProtein: 60,
      targetFat: 55,
      targetCarbs: 300,
    });
  });

  it("S-09: saved targets are used, with numeric columns read as numbers", () => {
    expect(
      toNutritionTarget({
        id: "settings-1",
        user_id: "user-1",
        target_calories: "1800",
        target_protein: "120.5",
        target_fat: "50",
        target_carbs: "0",
      }),
    ).toEqual({
      id: "settings-1",
      userId: "user-1",
      targetCalories: 1800,
      targetProtein: 120.5,
      targetFat: 50,
      targetCarbs: 0,
    });
  });
});
