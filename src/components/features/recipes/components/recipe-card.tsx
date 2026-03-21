"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{recipe.name}</p>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {recipe.servings}人分
              </Badge>
              {recipe.ingredients.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  材料{recipe.ingredients.length}品
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">
              {Math.round(recipe.calories / recipe.servings)}{" "}
              <span className="text-xs text-muted-foreground">kcal/人</span>
            </p>
            {totalCost > 0 && (
              <p className="text-xs text-muted-foreground">
                ¥{Math.round(totalCost / recipe.servings)}/人
              </p>
            )}
          </div>
        </div>
        <div className="mt-1.5">
          <span className="text-xs text-muted-foreground">
            P:{(recipe.protein / recipe.servings).toFixed(1)} F:
            {(recipe.fat / recipe.servings).toFixed(1)} C:
            {(recipe.carbs / recipe.servings).toFixed(1)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export { RecipeCard };
