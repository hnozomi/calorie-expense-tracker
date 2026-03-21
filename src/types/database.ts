/**
 * Supabase database types
 * TODO: Replace with auto-generated types via `supabase gen types typescript`
 */

export type DbMeal = {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  created_at: string;
  updated_at: string;
};

export type DbMealItem = {
  id: string;
  meal_id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cost: number | null;
  source_type: string;
  recipe_id: string | null;
  food_master_id: string | null;
  set_menu_id: string | null;
  serving_quantity: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DbMealItemCost = {
  id: string;
  meal_item_id: string;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type DbDailySummaryRow = {
  meal_type: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_cost: number;
  item_count: number;
};
