"use client";
// Client because the search box filters the list as you type

import { useState } from "react";
import { toast } from "sonner";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";
import { Input } from "@/components/ui/input";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { MealItemFormValues } from "../types/meal";
import { matchesSearch } from "../utils/matches-search";

type SetMenuItemWithIds = MealItemFormValues & {
  setMenuId?: string;
  foodMasterId?: string;
  recipeId?: string;
};

type SetMenuSelectorProps = {
  setMenus: SetMenu[];
  onSelect: (items: SetMenuItemWithIds[]) => void;
};

/** List of set menus with items; selecting adds all items to draft */
const SetMenuSelector = ({ setMenus, onSelect }: SetMenuSelectorProps) => {
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

  return (
    <div className="space-y-2">
      <div className="sticky -top-0.5 z-10 bg-background py-2">
        <Input
          placeholder="セットメニュー名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9"
        />
      </div>
      <div className="space-y-1">
        {filteredSetMenus.length > 0 ? (
          filteredSetMenus.map((menu) => (
            <button
              key={menu.id}
              type="button"
              className="flex w-full flex-col gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-muted active:bg-muted/80"
              onClick={() => handleSelect(menu)}
            >
              <div className="flex w-full items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{menu.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {menu.items.length}品
                  </p>
                </div>
                <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {Math.round(menu.totalCalories)} kcal
                </span>
              </div>
              <PfcDisplay
                protein={menu.totalProtein}
                fat={menu.totalFat}
                carbs={menu.totalCarbs}
              />
            </button>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {search.trim()
                ? "該当するセットメニューがありません"
                : "セットメニューが未登録です"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { SetMenuSelector };
