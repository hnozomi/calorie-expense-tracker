"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useFoodMasters } from "@/components/features/food-masters/hooks/use-food-masters";
import { Input } from "@/components/ui/input";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks";
import type { MealItemFormValues } from "../types/meal";

type FoodMasterSelectorProps = {
  onSelect: (values: MealItemFormValues) => void;
};

/** Select a food master item to add to the meal registration card */
const FoodMasterSelector = ({ onSelect }: FoodMasterSelectorProps) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const { data: foodMasters, isLoading } = useFoodMasters(debouncedSearch);

  const handleSelect = (fm: NonNullable<typeof foodMasters>[number]) => {
    onSelect({
      name: fm.name,
      calories: fm.calories,
      protein: fm.protein,
      fat: fm.fat,
      carbs: fm.carbs,
      cost: fm.defaultPrice ?? undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="食品名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-48 space-y-1 overflow-y-auto">
        {isLoading ? (
          ["fms1", "fms2", "fms3"].map((key) => (
            <Skeleton key={key} className="h-14 rounded-lg" />
          ))
        ) : foodMasters && foodMasters.length > 0 ? (
          foodMasters.map((fm) => (
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

export { FoodMasterSelector };
