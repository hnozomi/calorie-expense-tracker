import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { FoodCategory } from "@/types";

// The Supabase client has no generated types, so rows arrive untyped; the casts follow the table definitions in supabase/migrations

/** A food_masters row as Supabase returns it */
export const toFoodMaster = (row: Record<string, unknown>): FoodMaster => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string,
  brand: row.brand as string | null,
  category: row.category as FoodCategory | null,
  calories: Number(row.calories),
  protein: Number(row.protein),
  fat: Number(row.fat),
  carbs: Number(row.carbs),
  defaultPrice: row.default_price ? Number(row.default_price) : null,
  notes: row.notes as string | null,
  deletedAt: row.deleted_at as string | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});
