import { describe, expect, it } from "vitest";
import {
  collectMasterIds,
  createEmptyDailyMeals,
  groupDailyMeals,
  type MasterRow,
} from "@/components/features/meals/utils/meal-item-rows";

// The home screen reads a day's meals on the server (ui-tech §phase 2) and turns the rows into slots here.
// Items linked to a food master or recipe show the master's current values (AC-R-6: マスタを直すとホームの値が変わる),
// unless the master was deleted, when the record keeps its own values (03-db-design 論理削除方針).

const itemRow = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  meal_id: "meal-1",
  name: "記録した名前",
  calories: 100,
  protein: 10,
  fat: 5,
  carbs: 20,
  cost: 150,
  source_type: "manual",
  recipe_id: null,
  food_master_id: null,
  set_menu_id: null,
  serving_quantity: 1,
  sort_order: 0,
  created_at: "2026-10-20T00:00:00Z",
  updated_at: "2026-10-20T00:00:00Z",
  ...overrides,
});

const mealRow = (
  mealType: string,
  items: Record<string, unknown>[],
  id = `meal-${mealType}`,
) => ({ id, meal_type: mealType, meal_items: items });

const noMasters = () => new Map<string, MasterRow>();

describe("createEmptyDailyMeals", () => {
  it("S-01: every slot (朝食・昼食・夕食・間食) is there, empty, with no meal row", () => {
    expect(createEmptyDailyMeals()).toEqual({
      breakfast: { mealId: null, items: [] },
      lunch: { mealId: null, items: [] },
      dinner: { mealId: null, items: [] },
      snack: { mealId: null, items: [] },
    });
  });
});

describe("collectMasterIds", () => {
  it("AC-R-6: collects the food masters and recipes the items are linked to, once each", () => {
    const { foodMasterIds, recipeIds } = collectMasterIds([
      itemRow({ source_type: "food_master", food_master_id: "fm-1" }),
      itemRow({ source_type: "food_master", food_master_id: "fm-1" }),
      itemRow({ source_type: "food_master", food_master_id: "fm-2" }),
      itemRow({ source_type: "recipe", recipe_id: "r-1" }),
    ]);
    expect([...foodMasterIds].sort()).toEqual(["fm-1", "fm-2"]);
    expect([...recipeIds]).toEqual(["r-1"]);
  });

  it("AC-R-6: items not registered from a master (manual, OCR, set menu) need no master", () => {
    const { foodMasterIds, recipeIds } = collectMasterIds([
      itemRow({ source_type: "manual" }),
      itemRow({ source_type: "ocr" }),
      itemRow({ source_type: "set_menu", set_menu_id: "sm-1" }),
    ]);
    expect(foodMasterIds.size).toBe(0);
    expect(recipeIds.size).toBe(0);
  });

  it("AC-R-6: an id is looked up only for the source the item came from", () => {
    const { foodMasterIds, recipeIds } = collectMasterIds([
      itemRow({ source_type: "manual", food_master_id: "fm-1" }),
      itemRow({ source_type: "food_master", recipe_id: "r-1" }),
    ]);
    expect(foodMasterIds.size).toBe(0);
    expect(recipeIds.size).toBe(0);
  });

  it("AC-R-6: a master-linked item without an id is skipped", () => {
    const { foodMasterIds, recipeIds } = collectMasterIds([
      itemRow({ source_type: "food_master", food_master_id: null }),
      itemRow({ source_type: "recipe", recipe_id: null }),
    ]);
    expect(foodMasterIds.size).toBe(0);
    expect(recipeIds.size).toBe(0);
  });

  it("S-01: a day with no items needs no master", () => {
    const { foodMasterIds, recipeIds } = collectMasterIds([]);
    expect(foodMasterIds.size).toBe(0);
    expect(recipeIds.size).toBe(0);
  });
});

describe("groupDailyMeals", () => {
  it("S-01: a day without records has the four slots empty", () => {
    expect(groupDailyMeals([], noMasters(), noMasters())).toEqual(
      createEmptyDailyMeals(),
    );
  });

  it("S-01: each meal row goes to its own slot with its id, and the other slots stay empty", () => {
    const meals = groupDailyMeals(
      [
        mealRow("lunch", [itemRow({ id: "a", name: "うどん" })]),
        mealRow("snack", [itemRow({ id: "b", name: "プリン" })]),
      ],
      noMasters(),
      noMasters(),
    );
    expect(meals.lunch.mealId).toBe("meal-lunch");
    expect(meals.lunch.items.map((item) => item.name)).toEqual(["うどん"]);
    expect(meals.snack.mealId).toBe("meal-snack");
    expect(meals.snack.items.map((item) => item.name)).toEqual(["プリン"]);
    expect(meals.breakfast).toEqual({ mealId: null, items: [] });
    expect(meals.dinner).toEqual({ mealId: null, items: [] });
  });

  it("S-01: the items of a slot keep the order they were read in", () => {
    const meals = groupDailyMeals(
      [
        mealRow("dinner", [
          itemRow({ id: "a", name: "ごはん", sort_order: 0 }),
          itemRow({ id: "b", name: "味噌汁", sort_order: 1 }),
        ]),
      ],
      noMasters(),
      noMasters(),
    );
    expect(meals.dinner.items.map((item) => item.name)).toEqual([
      "ごはん",
      "味噌汁",
    ]);
  });

  it("S-01: a meal row with no items is an empty slot that still has its meal id", () => {
    const meals = groupDailyMeals(
      [{ id: "meal-x", meal_type: "breakfast", meal_items: null }],
      noMasters(),
      noMasters(),
    );
    expect(meals.breakfast).toEqual({ mealId: "meal-x", items: [] });
  });

  it("S-02a: a manually entered item shows the values that were recorded, with its link fields", () => {
    const meals = groupDailyMeals(
      [
        mealRow("breakfast", [
          itemRow({
            id: "item-9",
            meal_id: "meal-breakfast",
            name: "トースト",
            calories: "250.5",
            protein: "8",
            fat: "4.5",
            carbs: "40",
            cost: 80,
            source_type: "manual",
            serving_quantity: 1,
            sort_order: 2,
          }),
        ]),
      ],
      noMasters(),
      noMasters(),
    );
    expect(meals.breakfast.items[0]).toEqual({
      id: "item-9",
      mealId: "meal-breakfast",
      name: "トースト",
      calories: 250.5,
      protein: 8,
      fat: 4.5,
      carbs: 40,
      cost: 80,
      sourceType: "manual",
      recipeId: null,
      foodMasterId: null,
      setMenuId: null,
      servingQuantity: 1,
      sortOrder: 2,
      createdAt: "2026-10-20T00:00:00Z",
      updatedAt: "2026-10-20T00:00:00Z",
    });
  });

  it("S-02a: an item with no cost shows no cost (null)", () => {
    const meals = groupDailyMeals(
      [mealRow("lunch", [itemRow({ cost: null })])],
      noMasters(),
      noMasters(),
    );
    expect(meals.lunch.items[0].cost).toBeNull();
  });

  describe("food master items", () => {
    const foodMasters = (master: MasterRow) =>
      new Map<string, MasterRow>([["fm-1", master]]);

    it("AC-R-6: shows the food master's current name and nutrition, not the recorded values", () => {
      const meals = groupDailyMeals(
        [
          mealRow("lunch", [
            itemRow({ source_type: "food_master", food_master_id: "fm-1" }),
          ]),
        ],
        foodMasters({
          id: "fm-1",
          name: "直したおにぎり",
          calories: "180",
          protein: "4",
          fat: "1",
          carbs: "39",
          default_price: 140,
          deleted_at: null,
        }),
        noMasters(),
      );
      expect(meals.lunch.items[0]).toMatchObject({
        name: "直したおにぎり",
        calories: 180,
        protein: 4,
        fat: 1,
        carbs: 39,
        sourceType: "food_master",
        foodMasterId: "fm-1",
      });
    });

    it("03-db-design 論理削除方針: a deleted food master leaves the recorded values as they were", () => {
      const meals = groupDailyMeals(
        [
          mealRow("lunch", [
            itemRow({ source_type: "food_master", food_master_id: "fm-1" }),
          ]),
        ],
        foodMasters({
          id: "fm-1",
          name: "消したマスタ",
          calories: 999,
          protein: 99,
          fat: 99,
          carbs: 99,
          default_price: 999,
          deleted_at: "2026-10-01T00:00:00Z",
        }),
        noMasters(),
      );
      expect(meals.lunch.items[0]).toMatchObject({
        name: "記録した名前",
        calories: 100,
        protein: 10,
        fat: 5,
        carbs: 20,
        cost: 150,
        foodMasterId: "fm-1",
      });
    });

    it("AC-R-6: a food master that could not be read leaves the recorded values", () => {
      const meals = groupDailyMeals(
        [
          mealRow("lunch", [
            itemRow({ source_type: "food_master", food_master_id: "fm-404" }),
          ]),
        ],
        noMasters(),
        noMasters(),
      );
      expect(meals.lunch.items[0]).toMatchObject({
        name: "記録した名前",
        calories: 100,
      });
    });
  });

  describe("recipe items", () => {
    const recipes = (recipe: MasterRow) =>
      new Map<string, MasterRow>([["r-1", recipe]]);

    it("AC-R-6 / S-02: shows the recipe's current name and its values for one person", () => {
      const meals = groupDailyMeals(
        [
          mealRow("dinner", [
            itemRow({ source_type: "recipe", recipe_id: "r-1", cost: 300 }),
          ]),
        ],
        noMasters(),
        recipes({
          id: "r-1",
          name: "直したカレー",
          calories: 1600,
          protein: 80,
          fat: 60,
          carbs: 200,
          servings: 4,
          deleted_at: null,
        }),
      );
      expect(meals.dinner.items[0]).toMatchObject({
        name: "直したカレー",
        calories: 400,
        protein: 20,
        fat: 15,
        carbs: 50,
        sourceType: "recipe",
        recipeId: "r-1",
      });
    });

    it("S-02: a recipe for one person shows its values as they are", () => {
      const meals = groupDailyMeals(
        [
          mealRow("dinner", [
            itemRow({ source_type: "recipe", recipe_id: "r-1" }),
          ]),
        ],
        noMasters(),
        recipes({
          id: "r-1",
          name: "一人前",
          calories: 500,
          protein: 20,
          fat: 10,
          carbs: 70,
          servings: 1,
          deleted_at: null,
        }),
      );
      expect(meals.dinner.items[0].calories).toBe(500);
    });

    it("S-02: a recipe with 0 servings is not divided by zero (counted as one person)", () => {
      const meals = groupDailyMeals(
        [
          mealRow("dinner", [
            itemRow({ source_type: "recipe", recipe_id: "r-1" }),
          ]),
        ],
        noMasters(),
        recipes({
          id: "r-1",
          name: "人数なし",
          calories: 600,
          protein: 30,
          fat: 20,
          carbs: 80,
          servings: 0,
          deleted_at: null,
        }),
      );
      expect(meals.dinner.items[0].calories).toBe(600);
    });

    it("03-db-design 論理削除方針: a deleted recipe leaves the recorded values as they were", () => {
      const meals = groupDailyMeals(
        [
          mealRow("dinner", [
            itemRow({ source_type: "recipe", recipe_id: "r-1" }),
          ]),
        ],
        noMasters(),
        recipes({
          id: "r-1",
          name: "消したレシピ",
          calories: 9999,
          protein: 999,
          fat: 999,
          carbs: 999,
          servings: 1,
          deleted_at: "2026-10-01T00:00:00Z",
        }),
      );
      expect(meals.dinner.items[0]).toMatchObject({
        name: "記録した名前",
        calories: 100,
        protein: 10,
        fat: 5,
        carbs: 20,
      });
    });
  });
});
