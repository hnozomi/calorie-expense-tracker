"use client";

import { Suspense } from "react";
import { useSetMenus } from "@/components/features/set-menus/hooks/use-set-menus";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { Skeleton } from "@/components/ui/skeleton";
import type { MealItemFormValues } from "../types/meal";

type SetMenuItemWithIds = MealItemFormValues & {
  setMenuId?: string;
  foodMasterId?: string;
  recipeId?: string;
};

type SetMenuSelectorProps = {
  onSelect: (items: SetMenuItemWithIds[]) => void;
};

/** List of set menus with items; selecting adds all items to draft */
const SetMenuSelectorInner = ({ onSelect }: SetMenuSelectorProps) => {
  const { data: setMenus } = useSetMenus();

  const handleSelect = (menu: NonNullable<typeof setMenus>[number]) => {
    if (menu.items.length === 0) return;
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
    <div className="max-h-48 space-y-1 overflow-y-auto">
      {setMenus && setMenus.length > 0 ? (
        setMenus.map((menu) => (
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
            セットメニューが未登録です
          </p>
        </div>
      )}
    </div>
  );
};

/** Wrapper with Suspense boundary for lazy loading */
const SetMenuSelector = (props: SetMenuSelectorProps) => {
  return (
    <Suspense
      fallback={
        <div className="space-y-1">
          {["sms1", "sms2", "sms3"].map((key) => (
            <Skeleton key={key} className="h-14 rounded-lg" />
          ))}
        </div>
      }
    >
      <SetMenuSelectorInner {...props} />
    </Suspense>
  );
};

export { SetMenuSelector };
