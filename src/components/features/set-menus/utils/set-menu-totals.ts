import type { SetMenuItemDraft } from "@/components/features/set-menus/types/set-menu";

/** The set menu's totals: each item's values times its serving quantity */
export const calculateSetMenuTotals = (
  items: Pick<
    SetMenuItemDraft,
    "calories" | "protein" | "fat" | "carbs" | "cost" | "servingQuantity"
  >[],
) =>
  items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.servingQuantity,
      protein: acc.protein + item.protein * item.servingQuantity,
      fat: acc.fat + item.fat * item.servingQuantity,
      carbs: acc.carbs + item.carbs * item.servingQuantity,
      cost: acc.cost + item.cost * item.servingQuantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
  );
