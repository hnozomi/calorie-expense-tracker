import type { SetMenu, SetMenuItem } from "../types/set-menu";

/** A set_menus row (with set_menu_items) as Supabase returns it */
export const toSetMenu = (row: Record<string, unknown>): SetMenu => ({
  id: row.id as string,
  userId: row.user_id as string,
  name: row.name as string,
  totalCalories: Number(row.total_calories),
  totalProtein: Number(row.total_protein),
  totalFat: Number(row.total_fat),
  totalCarbs: Number(row.total_carbs),
  totalCost: Number(row.total_cost),
  deletedAt: row.deleted_at as string | null,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
  items: ((row.set_menu_items as Record<string, unknown>[]) ?? []).map(
    (item): SetMenuItem => ({
      id: item.id as string,
      setMenuId: item.set_menu_id as string,
      name: item.name as string,
      recipeId: (item.recipe_id as string) ?? null,
      foodMasterId: (item.food_master_id as string) ?? null,
      calories: Number(item.calories),
      protein: Number(item.protein),
      fat: Number(item.fat),
      carbs: Number(item.carbs),
      cost: Number(item.cost),
      servingQuantity: Number(item.serving_quantity),
      sortOrder: Number(item.sort_order),
    }),
  ),
});
