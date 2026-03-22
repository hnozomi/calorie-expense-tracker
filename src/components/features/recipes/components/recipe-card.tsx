"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PfcDisplay } from "@/components/ui/pfc-display";
import type { Recipe } from "../types/recipe";

type RecipeCardProps = {
  recipe: Recipe;
  onClick: () => void;
};

/** Card displaying a recipe's name, servings, nutrition, and ingredient cost */
const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  /** Calculate total ingredient cost */
  const totalCost = recipe.ingredients.reduce(
    (sum, ing) => sum + ing.unitPrice * ing.quantity,
    0,
  );

  return (
    <Card
      className="cursor-pointer border-muted-foreground/10 transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99]"
      onClick={onClick}
    >
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-snug">
              {recipe.name}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Badge className="rounded-full bg-brand-muted px-2.5 py-0.5 text-[11px] font-semibold text-brand dark:bg-brand/20 dark:text-brand">
                {recipe.servings}人分
              </Badge>
              {recipe.ingredients.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  材料{recipe.ingredients.length}品
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-lg font-bold leading-tight text-brand">
              {Math.round(recipe.calories / recipe.servings)}
              <span className="ml-0.5 text-[11px] font-medium text-muted-foreground">
                kcal/人
              </span>
            </p>
            {totalCost > 0 && (
              <p className="flex items-center text-xs font-medium text-muted-foreground">
                <span className="mr-0.5 text-[10px]">¥</span>
                {Math.round(totalCost / recipe.servings)}/人
              </p>
            )}
          </div>
        </div>
        <div className="mt-2">
          <PfcDisplay
            protein={recipe.protein / recipe.servings}
            fat={recipe.fat / recipe.servings}
            carbs={recipe.carbs / recipe.servings}
            size="sm"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { RecipeCard };
