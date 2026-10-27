import { describe, expect, it } from "vitest";
import {
  collectPlanMasterIds,
  type MasterRow,
  toMealPlan,
} from "@/components/features/plan/utils/meal-plan-rows";

const planRow = (overrides: Record<string, unknown> = {}) => ({
  id: "plan-1",
  user_id: "user-1",
  date: "2026-10-21",
  meal_type: "dinner",
  planned_name: "保存した名前",
  calories: 500,
  protein: 20,
  fat: 15,
  carbs: 60,
  estimated_cost: 300,
  recipe_id: null,
  food_master_id: null,
  set_menu_id: null,
  is_transferred: false,
  created_at: "2026-10-20T00:00:00Z",
  ...overrides,
});

const noMasters = () => new Map<string, MasterRow>();

describe("collectPlanMasterIds", () => {
  it("AC-R-2: collects each linked food master and recipe once, to read them on the server in one query each", () => {
    const { foodMasterIds, recipeIds } = collectPlanMasterIds([
      planRow({ food_master_id: "fm-1" }),
      planRow({ food_master_id: "fm-1" }),
      planRow({ recipe_id: "recipe-1" }),
      planRow(),
    ]);
    expect([...foodMasterIds]).toEqual(["fm-1"]);
    expect([...recipeIds]).toEqual(["recipe-1"]);
  });
});

describe("toMealPlan", () => {
  it("P-1: a manual plan shows what was saved", () => {
    expect(toMealPlan(planRow(), noMasters(), noMasters())).toEqual({
      id: "plan-1",
      userId: "user-1",
      date: "2026-10-21",
      mealType: "dinner",
      plannedName: "保存した名前",
      calories: 500,
      protein: 20,
      fat: 15,
      carbs: 60,
      estimatedCost: 300,
      recipeId: null,
      foodMasterId: null,
      setMenuId: null,
      isTransferred: false,
      createdAt: "2026-10-20T00:00:00Z",
    });
  });

  it("AC-R-6: a plan from a food master shows the master's current values and price", () => {
    const masters = new Map<string, MasterRow>([
      [
        "fm-1",
        {
          name: "直した納豆",
          calories: 95,
          protein: 9,
          fat: 5,
          carbs: 6,
          default_price: 70,
          deleted_at: null,
        },
      ],
    ]);

    const plan = toMealPlan(
      planRow({ food_master_id: "fm-1" }),
      masters,
      noMasters(),
    );

    expect(plan).toMatchObject({
      plannedName: "直した納豆",
      calories: 95,
      protein: 9,
      estimatedCost: 70,
      foodMasterId: "fm-1",
    });
  });

  it("AC-R-6: a plan from a recipe shows one serving of the recipe's current values, keeping its own cost", () => {
    const recipes = new Map<string, MasterRow>([
      [
        "recipe-1",
        {
          name: "直したカレー",
          calories: 1400,
          protein: 40,
          fat: 30,
          carbs: 160,
          servings: 2,
          deleted_at: null,
        },
      ],
    ]);

    const plan = toMealPlan(
      planRow({ recipe_id: "recipe-1", estimated_cost: 250 }),
      noMasters(),
      recipes,
    );

    expect(plan).toMatchObject({
      plannedName: "直したカレー",
      calories: 700,
      protein: 20,
      fat: 15,
      carbs: 80,
      estimatedCost: 250,
    });
  });

  it("AC-R-6: a deleted master leaves the plan with what was saved", () => {
    const masters = new Map<string, MasterRow>([
      [
        "fm-1",
        {
          name: "消した食品",
          calories: 1,
          protein: 1,
          fat: 1,
          carbs: 1,
          default_price: 1,
          deleted_at: "2026-10-01T00:00:00Z",
        },
      ],
    ]);

    const plan = toMealPlan(
      planRow({ food_master_id: "fm-1" }),
      masters,
      noMasters(),
    );

    expect(plan).toMatchObject({ plannedName: "保存した名前", calories: 500 });
  });
});
