import { describe, expect, it } from "vitest";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import {
  buildShoppingList,
  formatShoppingQuantity,
} from "@/components/features/plan/utils/shopping-list";
import type {
  Recipe,
  RecipeIngredient,
} from "@/components/features/recipes/types/recipe";

const createPlan = (overrides: Partial<MealPlan> = {}): MealPlan => ({
  id: "plan-1",
  userId: "user-1",
  date: "2026-07-06",
  mealType: "dinner",
  plannedName: "カレー",
  recipeId: "recipe-curry",
  foodMasterId: null,
  setMenuId: null,
  calories: 600,
  protein: 20,
  fat: 15,
  carbs: 80,
  estimatedCost: 300,
  isTransferred: false,
  createdAt: "2026-07-01T00:00:00Z",
  ...overrides,
});

const createIngredient = (
  overrides: Partial<RecipeIngredient> = {},
): RecipeIngredient => ({
  id: "ing-1",
  recipeId: "recipe-curry",
  ingredientName: "じゃがいも",
  quantity: 4,
  unit: "個",
  unitPrice: 200,
  ...overrides,
});

const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: "recipe-curry",
  userId: "user-1",
  name: "カレー",
  servings: 2,
  calories: 1200,
  protein: 40,
  fat: 30,
  carbs: 160,
  notes: null,
  deletedAt: null,
  createdAt: "2026-07-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
  ingredients: [createIngredient()],
  ...overrides,
});

describe("buildShoppingList", () => {
  it("プラン1件(1人分)は材料を人数割りした量になる", () => {
    const entries = buildShoppingList([createPlan()], [createRecipe()]);
    // レシピは2人分・じゃがいも4個 → 1人分は2個、単価も半分
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      ingredientName: "じゃがいも",
      unit: "個",
      totalQuantity: 2,
      estimatedCost: 100,
    });
  });

  it("同じレシピの複数プランは人数分が積み上がる", () => {
    const plans = [
      createPlan({ id: "p1", date: "2026-07-06" }),
      createPlan({ id: "p2", date: "2026-07-07" }),
      createPlan({ id: "p3", date: "2026-07-08" }),
    ];
    const entries = buildShoppingList(plans, [createRecipe()]);
    // 3人分 / 2人分レシピ = 1.5倍 → 4個×1.5 = 6個
    expect(entries[0].totalQuantity).toBe(6);
    expect(entries[0].estimatedCost).toBe(300);
  });

  it("別レシピの同名・同単位の材料は1行に合算される", () => {
    const recipes = [
      createRecipe(),
      createRecipe({
        id: "recipe-nikujaga",
        name: "肉じゃが",
        servings: 1,
        ingredients: [
          createIngredient({
            id: "ing-2",
            recipeId: "recipe-nikujaga",
            quantity: 3,
            unitPrice: 150,
          }),
        ],
      }),
    ];
    const plans = [
      createPlan(),
      createPlan({ id: "p2", recipeId: "recipe-nikujaga" }),
    ];
    const entries = buildShoppingList(plans, recipes);
    expect(entries).toHaveLength(1);
    expect(entries[0].totalQuantity).toBe(5); // 2(カレー) + 3(肉じゃが)
    expect(entries[0].estimatedCost).toBe(250); // 100 + 150
  });

  it("同名でも単位が違う材料は別行になる", () => {
    const recipe = createRecipe({
      ingredients: [
        createIngredient(),
        createIngredient({ id: "ing-2", unit: "g", quantity: 100 }),
      ],
    });
    const entries = buildShoppingList([createPlan()], [recipe]);
    expect(entries).toHaveLength(2);
  });

  it("レシピ由来でないプラン(手動・マスタ・セット)は無視される", () => {
    const plans = [
      createPlan({ recipeId: null }),
      createPlan({ id: "p2", recipeId: null, foodMasterId: "fm-1" }),
    ];
    expect(buildShoppingList(plans, [createRecipe()])).toHaveLength(0);
  });

  it("削除済み等でレシピが見つからないプランは無視される", () => {
    const plans = [createPlan({ recipeId: "recipe-deleted" })];
    expect(buildShoppingList(plans, [createRecipe()])).toHaveLength(0);
  });

  it("プランが空なら空配列を返す", () => {
    expect(buildShoppingList([], [createRecipe()])).toHaveLength(0);
  });

  it("材料名の50音順でソートされる", () => {
    const recipe = createRecipe({
      ingredients: [
        createIngredient({ id: "i1", ingredientName: "にんじん" }),
        createIngredient({ id: "i2", ingredientName: "うどん" }),
      ],
    });
    const entries = buildShoppingList([createPlan()], [recipe]);
    expect(entries.map((entry) => entry.ingredientName)).toEqual([
      "うどん",
      "にんじん",
    ]);
  });
});

describe("formatShoppingQuantity", () => {
  it.each([
    ["整数はそのまま", 6, "6"],
    ["小数1桁はそのまま", 1.5, "1.5"],
    ["小数2桁以上は1桁に丸める", 0.333, "0.3"],
    ["丸めて整数になる値は小数を出さない", 1.98, "2"],
  ])("%s", (_label, input, expected) => {
    expect(formatShoppingQuantity(input)).toBe(expected);
  });
});
