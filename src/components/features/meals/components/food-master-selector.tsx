"use client";
// Client because the search box filters the list as you type

import { Search } from "lucide-react";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { Input } from "@/components/ui/input";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { useFoodMasterSelector } from "../hooks/use-food-master-selector";
import type { MealItemFormValues } from "../types/meal";

type Props = {
  foodMasters: FoodMaster[];
  onSelect: (values: MealItemFormValues, foodMasterId: string) => void;
};

/** Select a food master item to add to the meal registration card */
export const FoodMasterSelector = ({ foodMasters, onSelect }: Props) => {
  const { search, setSearch, filteredFoodMasters, handleSelect } =
    useFoodMasterSelector(foodMasters, onSelect);

  return (
    <div className="space-y-3">
      <div className="sticky -top-0.5 z-10 bg-background py-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="食品名・ブランドで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-1">
        {filteredFoodMasters.length > 0 ? (
          filteredFoodMasters.map((fm) => (
            <button
              key={fm.id}
              type="button"
              className="flex w-full flex-col gap-1 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors hover:border-border hover:bg-muted active:bg-muted/80"
              onClick={() => handleSelect(fm)}
            >
              <div className="flex w-full items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{fm.name}</p>
                  {fm.brand && (
                    <p className="truncate text-xs text-muted-foreground">
                      {fm.brand}
                    </p>
                  )}
                </div>
                <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                  {Math.round(fm.calories)} kcal
                </span>
              </div>
              <PfcDisplay protein={fm.protein} fat={fm.fat} carbs={fm.carbs} />
            </button>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-muted-foreground/25 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {search ? "該当する食品がありません" : "食品マスタが未登録です"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
