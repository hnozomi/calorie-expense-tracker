import { MEAL_TYPES } from "@/types";
import type {
  DailyMealGroup,
  DisplayedDailyMeals,
  DisplayedMealItem,
  MealChange,
} from "../types/meal";

/** Items per slot, without the meal row ids the screen does not need */
export const toDisplayedDailyMeals = (
  meals: DailyMealGroup,
): DisplayedDailyMeals => ({
  breakfast: meals.breakfast.items,
  lunch: meals.lunch.items,
  dinner: meals.dinner.items,
  snack: meals.snack.items,
});

const mapEverySlot = (
  meals: DisplayedDailyMeals,
  mapItems: (items: DisplayedMealItem[]) => DisplayedMealItem[],
): DisplayedDailyMeals =>
  Object.fromEntries(
    MEAL_TYPES.map((mealType) => [mealType, mapItems(meals[mealType])]),
  ) as DisplayedDailyMeals; // fromEntries loses the key type; every MEAL_TYPES key is set

/** Show a change right away, before the server confirms it */
export const applyMealChange = (
  meals: DisplayedDailyMeals,
  change: MealChange,
): DisplayedDailyMeals => {
  switch (change.type) {
    case "add": {
      const added: DisplayedMealItem[] = change.items.map((draft, index) => ({
        id: `optimistic-${draft.tempId}`,
        mealId: "",
        name: draft.name,
        calories: draft.calories,
        protein: draft.protein,
        fat: draft.fat,
        carbs: draft.carbs,
        cost: draft.cost ?? null,
        sourceType: draft.sourceType,
        recipeId: draft.recipeId ?? null,
        foodMasterId: draft.foodMasterId ?? null,
        setMenuId: draft.setMenuId ?? null,
        servingQuantity: 1,
        sortOrder: meals[change.mealType].length + index,
        createdAt: "",
        updatedAt: "",
        isOptimistic: true,
      }));
      return {
        ...meals,
        [change.mealType]: [...meals[change.mealType], ...added],
      };
    }
    case "update":
      return mapEverySlot(meals, (items) =>
        items.map((item) =>
          item.id === change.itemId
            ? { ...item, ...change.values, cost: change.values.cost ?? null }
            : item,
        ),
      );
    case "remove":
      return mapEverySlot(meals, (items) =>
        items.filter((item) => item.id !== change.itemId),
      );
  }
};
