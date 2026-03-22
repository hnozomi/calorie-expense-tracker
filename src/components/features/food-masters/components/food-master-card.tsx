"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PfcDisplay } from "@/components/ui/pfc-display";
import { FOOD_CATEGORY_LABELS } from "@/types";
import type { FoodMaster } from "../types/food-master";

type FoodMasterCardProps = {
  foodMaster: FoodMaster;
  onClick: () => void;
};

/** Card displaying a food master's name, nutrition, and category */
const FoodMasterCard = ({ foodMaster, onClick }: FoodMasterCardProps) => {
  return (
    <Card
      className="cursor-pointer border-muted-foreground/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-snug">
              {foodMaster.name}
            </p>
            {foodMaster.brand && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {foodMaster.brand}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-lg font-bold leading-tight text-brand">
              {Math.round(foodMaster.calories)}
              <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
                kcal
              </span>
            </p>
            {foodMaster.defaultPrice != null && (
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <span className="mr-0.5 text-[10px]">¥</span>
                {Math.round(foodMaster.defaultPrice)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          {foodMaster.category && (
            <Badge
              variant="secondary"
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
            >
              {FOOD_CATEGORY_LABELS[foodMaster.category]}
            </Badge>
          )}
          <PfcDisplay
            protein={foodMaster.protein}
            fat={foodMaster.fat}
            carbs={foodMaster.carbs}
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { FoodMasterCard };
