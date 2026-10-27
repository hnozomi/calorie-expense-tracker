"use client";

import { useState } from "react";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import type { MealItemFormValues } from "../types/meal";
import { matchesSearch } from "../utils/matches-search";

/** Search matches the name or the brand */
export const useFoodMasterSelector = (
  foodMasters: FoodMaster[],
  onSelect: (values: MealItemFormValues, foodMasterId: string) => void,
) => {
  const [search, setSearch] = useState("");
  const filteredFoodMasters = foodMasters.filter((fm) =>
    matchesSearch([fm.name, fm.brand], search),
  );

  const handleSelect = (fm: FoodMaster) => {
    onSelect(
      {
        name: fm.name,
        calories: fm.calories,
        protein: fm.protein,
        fat: fm.fat,
        carbs: fm.carbs,
        cost: fm.defaultPrice ?? undefined,
      },
      fm.id,
    );
  };

  return { search, setSearch, filteredFoodMasters, handleSelect };
};
