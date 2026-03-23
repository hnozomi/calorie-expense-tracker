"use client";

import { Plus, ShoppingBasket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import type { EditableIngredient } from "../hooks/use-recipe-form-controller";
import type { IngredientFormValues } from "../types/recipe";

type RecipeIngredientsEditorProps = {
  ingredients: EditableIngredient[];
  onAdd: () => void;
  onChange: (
    tempId: string,
    field: keyof IngredientFormValues,
    value: string,
  ) => void;
  onRemove: (tempId: string) => void;
};

const RecipeIngredientsEditor = ({
  ingredients,
  onAdd,
  onChange,
  onRemove,
}: RecipeIngredientsEditorProps) => {
  return (
    <section className="space-y-3">
      <SectionHeader icon={ShoppingBasket} label="材料">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-7 gap-1 text-xs"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5" />
          追加
        </Button>
      </SectionHeader>
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        {ingredients.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            「追加」から材料を入力してください
          </p>
        ) : (
          <div className="space-y-2.5">
            {ingredients.map((ingredient) => (
              <div
                key={ingredient.tempId}
                className="relative rounded-lg border border-border/60 bg-white p-3 shadow-sm dark:bg-background"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute right-1.5 top-1.5 h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(ingredient.tempId)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <div className="space-y-2 pr-7">
                  <Input
                    placeholder="材料名"
                    value={ingredient.ingredientName}
                    onChange={(event) =>
                      onChange(
                        ingredient.tempId,
                        "ingredientName",
                        event.target.value,
                      )
                    }
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        数量
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={ingredient.quantity || ""}
                        onChange={(event) =>
                          onChange(
                            ingredient.tempId,
                            "quantity",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        単位
                      </Label>
                      <Input
                        placeholder="g, ml..."
                        value={ingredient.unit}
                        onChange={(event) =>
                          onChange(
                            ingredient.tempId,
                            "unit",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">
                        単価(円)
                      </Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={ingredient.unitPrice || ""}
                        onChange={(event) =>
                          onChange(
                            ingredient.tempId,
                            "unitPrice",
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export { RecipeIngredientsEditor };
