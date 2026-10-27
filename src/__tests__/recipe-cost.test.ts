import { describe, expect, it } from "vitest";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import { totalIngredientCost } from "@/components/features/recipes/utils/recipe-cost";

type Ingredient = Recipe["ingredients"][number];

const ingredient = (unitPrice: number, quantity: number): Ingredient => ({
  id: crypto.randomUUID(),
  recipeId: "recipe-1",
  ingredientName: "材料",
  quantity,
  unit: "個",
  unitPrice,
});

describe("totalIngredientCost", () => {
  it("S-05: 材料が無ければ 0 円", () => {
    expect(totalIngredientCost({ ingredients: [] })).toBe(0);
  });

  it("S-05: 材料ごとの単価×数量を足した、レシピ全量の食費", () => {
    // ¥40 × 3 + ¥150 × 2
    expect(
      totalIngredientCost({
        ingredients: [ingredient(40, 3), ingredient(150, 2)],
      }),
    ).toBe(420);
  });

  it("S-05: 小数の数量(0.5 個 など)もそのまま掛けて、丸めない", () => {
    // ¥99 × 0.5
    expect(totalIngredientCost({ ingredients: [ingredient(99, 0.5)] })).toBe(
      49.5,
    );
  });
});
