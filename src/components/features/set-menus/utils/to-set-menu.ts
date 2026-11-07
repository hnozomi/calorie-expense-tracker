import type { Tables } from "@/lib/supabase/database.types";
import type { SetMenu, SetMenuItem } from "../types/set-menu";

type SetMenuWithItemsRow = Tables<"set_menus"> & {
  set_menu_items: Tables<"set_menu_items">[];
};

/** A set_menus row (with set_menu_items) as Supabase returns it */
export const toSetMenu = (row: SetMenuWithItemsRow): SetMenu => ({
  id: row.id,
  userId: row.user_id,
  name: row.name,
  totalCalories: Number(row.total_calories),
  totalProtein: Number(row.total_protein),
  totalFat: Number(row.total_fat),
  totalCarbs: Number(row.total_carbs),
  totalCost: Number(row.total_cost),
  deletedAt: row.deleted_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  items: row.set_menu_items.map(
    (item): SetMenuItem => ({
      id: item.id,
      setMenuId: item.set_menu_id,
      name: item.name,
      recipeId: item.recipe_id,
      foodMasterId: item.food_master_id,
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
