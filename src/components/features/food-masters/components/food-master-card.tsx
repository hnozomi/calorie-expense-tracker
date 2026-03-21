"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FOOD_CATEGORY_LABELS } from "@/types";
import type { FoodMaster } from "../types/food-master";

type FoodMasterCardProps = {
  foodMaster: FoodMaster;
  onClick: () => void;
};

/** Card displaying a food master's name, nutrition, and category */
const FoodMasterCard = ({ foodMaster, onClick }: FoodMasterCardProps) => {
  return (
    <Card className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{foodMaster.name}</p>
            {foodMaster.brand && (
              <p className="truncate text-xs text-muted-foreground">
                {foodMaster.brand}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-medium">
              {Math.round(foodMaster.calories)}{" "}
              <span className="text-xs text-muted-foreground">kcal</span>
            </p>
            {foodMaster.defaultPrice != null && (
              <p className="text-xs text-muted-foreground">
                ¥{Math.round(foodMaster.defaultPrice)}
              </p>
            )}
          </div>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          {foodMaster.category && (
            <Badge variant="outline" className="text-xs">
              {FOOD_CATEGORY_LABELS[foodMaster.category]}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            P:{foodMaster.protein.toFixed(1)} F:{foodMaster.fat.toFixed(1)} C:
            {foodMaster.carbs.toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export { FoodMasterCard };
