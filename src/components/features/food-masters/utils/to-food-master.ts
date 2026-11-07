import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { Tables } from "@/lib/supabase/database.types";
import type { FoodCategory } from "@/types";

/** A food_masters row as Supabase returns it */
export const toFoodMaster = (row: Tables<"food_masters">): FoodMaster => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  brand: row.brand,
  // category is a check-constrained text column holding one of the food categories
  category: row.category as FoodCategory | null,
  calories: Number(row.calories),
  protein: Number(row.protein),
  fat: Number(row.fat),
  carbs: Number(row.carbs),
  defaultPrice: row.default_price ? Number(row.default_price) : null,
  notes: row.notes,
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
