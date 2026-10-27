"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import type { MealItemFormValues } from "../types/meal";
import { matchesSearch } from "../utils/matches-search";

export type SetMenuItemWithIds = MealItemFormValues & {
  setMenuId?: string;
  foodMasterId?: string;
  recipeId?: string;
};

/** A tap adds every item of the set */
export const useSetMenuSelector = (
  setMenus: SetMenu[],
  onSelect: (items: SetMenuItemWithIds[]) => void,
) => {
  const [search, setSearch] = useState("");
  const filteredSetMenus = setMenus.filter((menu) =>
    matchesSearch([menu.name], search),
  );

  const handleSelect = (menu: SetMenu) => {
    if (menu.items.length === 0) {
      toast.info("このセットメニューにはアイテムがありません");
      return;
    }
    const items = menu.items.map((item) => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      cost: item.cost || undefined,
      setMenuId: menu.id,
      foodMasterId: item.foodMasterId ?? undefined,
      recipeId: item.recipeId ?? undefined,
    }));
    onSelect(items);
  };

  return { search, setSearch, filteredSetMenus, handleSelect };
};
