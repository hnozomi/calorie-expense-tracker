/** Meal timing categories */
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/** Display labels for meal types */
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
} as const;

/** Source of a meal item registration */
export const SOURCE_TYPES = [
  "manual",
  "ocr",
  "recipe",
  "food_master",
  "set_menu",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Food master categories */
export const FOOD_CATEGORIES = [
  "bento",
  "bread",
  "side_dish",
  "snack",
  "drink",
  "ingredient",
  "other",
] as const;
export type FoodCategory = (typeof FOOD_CATEGORIES)[number];

/** Display labels for food categories */
export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  bento: "弁当",
  bread: "パン",
  side_dish: "惣菜",
  snack: "菓子",
  drink: "飲料",
  ingredient: "食材",
  other: "その他",
} as const;

/** Nutrition values shared across entities */
export type NutritionValues = {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};
