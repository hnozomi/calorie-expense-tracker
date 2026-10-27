import { describe, expect, it } from "vitest";
import type {
  DisplayedDailyMeals,
  MealItemDraft,
} from "@/components/features/meals/types/meal";
import {
  applyMealChange,
  toDisplayedDailyMeals,
} from "@/components/features/meals/utils/apply-meal-change";
import { createMealItem, emptyDailyMeals } from "./helpers/daily-meals";

const draft = (overrides: Partial<MealItemDraft> = {}): MealItemDraft => ({
  tempId: "temp-1",
  name: "親子丼",
  calories: 650,
  protein: 30,
  fat: 15,
  carbs: 90,
  sourceType: "manual",
  ...overrides,
});

const displayedMeals = (
  overrides: Partial<DisplayedDailyMeals> = {},
): DisplayedDailyMeals => ({
  breakfast: [],
  lunch: [],
  dinner: [],
  snack: [],
  ...overrides,
});

describe("toDisplayedDailyMeals", () => {
  it("AC-R-2: keeps the items the server read, slot by slot", () => {
    const toast = createMealItem({ name: "トースト" });
    const ramen = createMealItem({ name: "ラーメン" });
    const meals = emptyDailyMeals();
    meals.breakfast = { mealId: "meal-b", items: [toast] };
    meals.dinner = { mealId: "meal-d", items: [ramen] };

    expect(toDisplayedDailyMeals(meals)).toEqual({
      breakfast: [toast],
      lunch: [],
      dinner: [ramen],
      snack: [],
    });
  });
});

describe("applyMealChange", () => {
  describe("add", () => {
    it("AC-R-5: registered drafts appear at the end of their slot at once", () => {
      const existing = createMealItem({ name: "サラダ", sortOrder: 0 });
      const result = applyMealChange(displayedMeals({ lunch: [existing] }), {
        type: "add",
        mealType: "lunch",
        items: [
          draft({ name: "親子丼" }),
          draft({ tempId: "temp-2", name: "みそ汁" }),
        ],
      });

      expect(result.lunch.map((item) => item.name)).toEqual([
        "サラダ",
        "親子丼",
        "みそ汁",
      ]);
    });

    it("AC-R-5: added items are marked as still being saved and keep the draft's values", () => {
      const result = applyMealChange(displayedMeals(), {
        type: "add",
        mealType: "dinner",
        items: [
          draft({
            name: "鮭定食",
            calories: 700,
            protein: 35,
            fat: 20,
            carbs: 80,
            cost: 900,
            sourceType: "food_master",
            foodMasterId: "fm-1",
          }),
        ],
      });

      expect(result.dinner).toHaveLength(1);
      expect(result.dinner[0]).toMatchObject({
        name: "鮭定食",
        calories: 700,
        protein: 35,
        fat: 20,
        carbs: 80,
        cost: 900,
        sourceType: "food_master",
        foodMasterId: "fm-1",
        recipeId: null,
        setMenuId: null,
        isOptimistic: true,
      });
    });

    it("AC-R-5: a draft without a cost shows no cost (null)", () => {
      const result = applyMealChange(displayedMeals(), {
        type: "add",
        mealType: "snack",
        items: [draft({ cost: undefined })],
      });
      expect(result.snack[0].cost).toBeNull();
    });

    it("AC-R-5: each added item gets its own id, distinct from the saved ones", () => {
      const result = applyMealChange(displayedMeals(), {
        type: "add",
        mealType: "lunch",
        items: [draft({ tempId: "a" }), draft({ tempId: "b" })],
      });
      const ids = result.lunch.map((item) => item.id);
      expect(new Set(ids).size).toBe(2);
    });

    it("AC-R-5: the other slots stay as they were", () => {
      const breakfast = [createMealItem({ name: "トースト" })];
      const before = displayedMeals({ breakfast });
      const result = applyMealChange(before, {
        type: "add",
        mealType: "lunch",
        items: [draft()],
      });
      expect(result.breakfast).toEqual(breakfast);
      expect(result.dinner).toEqual([]);
      expect(result.snack).toEqual([]);
    });

    it("AC-R-5: the meals passed in are not changed (the confirmed state stays for the rollback)", () => {
      const before = displayedMeals();
      applyMealChange(before, {
        type: "add",
        mealType: "lunch",
        items: [draft()],
      });
      expect(before.lunch).toEqual([]);
    });
  });

  describe("update", () => {
    it("AC-R-5: the edited item shows its new values at once", () => {
      const item = createMealItem({
        id: "item-1",
        name: "ポテチ",
        calories: 200,
      });
      const result = applyMealChange(displayedMeals({ snack: [item] }), {
        type: "update",
        itemId: "item-1",
        values: {
          name: "ポテチ(大)",
          calories: 250,
          protein: 3,
          fat: 15,
          carbs: 25,
          cost: 180,
        },
      });

      expect(result.snack[0]).toMatchObject({
        id: "item-1",
        name: "ポテチ(大)",
        calories: 250,
        protein: 3,
        fat: 15,
        carbs: 25,
        cost: 180,
      });
    });

    it("AC-R-5: clearing the cost shows no cost (null)", () => {
      const item = createMealItem({ id: "item-1", cost: 250 });
      const result = applyMealChange(displayedMeals({ lunch: [item] }), {
        type: "update",
        itemId: "item-1",
        values: {
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
        },
      });
      expect(result.lunch[0].cost).toBeNull();
    });

    it("AC-R-5: other items, in the same slot or not, stay as they were", () => {
      const target = createMealItem({ id: "item-1", calories: 100 });
      const sameSlot = createMealItem({ id: "item-2", calories: 300 });
      const otherSlot = createMealItem({ id: "item-3", calories: 500 });
      const result = applyMealChange(
        displayedMeals({ lunch: [target, sameSlot], dinner: [otherSlot] }),
        {
          type: "update",
          itemId: "item-1",
          values: {
            name: "変更後",
            calories: 999,
            protein: 0,
            fat: 0,
            carbs: 0,
          },
        },
      );
      expect(result.lunch[1]).toEqual(sameSlot);
      expect(result.dinner[0]).toEqual(otherSlot);
    });

    it("AC-R-5: an id that is on no slot changes nothing", () => {
      const item = createMealItem({ id: "item-1" });
      const before = displayedMeals({ lunch: [item] });
      const result = applyMealChange(before, {
        type: "update",
        itemId: "missing",
        values: { name: "x", calories: 1, protein: 0, fat: 0, carbs: 0 },
      });
      expect(result).toEqual(before);
    });
  });

  describe("remove", () => {
    it("AC-R-5: the deleted item disappears from its slot at once", () => {
      const keep = createMealItem({ id: "keep", name: "サラダ" });
      const removed = createMealItem({ id: "gone", name: "ポテチ" });
      const result = applyMealChange(
        displayedMeals({ snack: [keep, removed] }),
        {
          type: "remove",
          itemId: "gone",
        },
      );
      expect(result.snack.map((item) => item.id)).toEqual(["keep"]);
    });

    it("AC-R-5: removing the only item leaves the slot empty", () => {
      const only = createMealItem({ id: "only" });
      const result = applyMealChange(displayedMeals({ dinner: [only] }), {
        type: "remove",
        itemId: "only",
      });
      expect(result.dinner).toEqual([]);
    });

    it("AC-R-5: an id that is on no slot changes nothing", () => {
      const item = createMealItem({ id: "item-1" });
      const before = displayedMeals({ breakfast: [item] });
      expect(
        applyMealChange(before, { type: "remove", itemId: "missing" }),
      ).toEqual(before);
    });
  });
});
