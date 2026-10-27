import { Flame, Sparkles } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { RecipeFormInput } from "@/components/features/recipes/types/recipe";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PfcInputCard } from "@/components/ui/pfc-display";
import { SectionHeader } from "@/components/ui/section-header";

type Props = {
  register: UseFormRegister<RecipeFormInput>;
  errors: FieldErrors<RecipeFormInput>;
  totalIngredientCost: number;
};

export const RecipeNutritionSection = ({
  register,
  errors,
  totalIngredientCost,
}: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Flame} label="栄養成分（合計）">
      <span className="ml-auto text-xs font-normal text-muted-foreground">
        食費合計: ¥{Math.round(totalIngredientCost)}
      </span>
    </SectionHeader>
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <p className="text-xs text-muted-foreground">
        レシピ全量の栄養成分を入力してください（材料からの自動計算は行われません）
      </p>
      {/* Calories */}
      <div className="space-y-1.5">
        <Label htmlFor="recipe-calories" className="text-xs">
          <Sparkles className="mr-1 inline-block h-3 w-3 text-amber-500" />
          カロリー (kcal)
        </Label>
        <Input
          id="recipe-calories"
          type="number"
          inputMode="decimal"
          step="any"
          className="text-lg font-semibold tracking-wide"
          placeholder="0"
          {...register("calories")}
        />
        {errors.calories && (
          <p className="text-xs text-destructive">{errors.calories.message}</p>
        )}
      </div>

      {/* PFC color-coded cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <PfcInputCard
          id="recipe-protein"
          nutrient="protein"
          error={errors.protein?.message}
          {...register("protein")}
        />
        <PfcInputCard
          id="recipe-fat"
          nutrient="fat"
          error={errors.fat?.message}
          {...register("fat")}
        />
        <PfcInputCard
          id="recipe-carbs"
          nutrient="carbs"
          error={errors.carbs?.message}
          {...register("carbs")}
        />
      </div>
    </div>
  </section>
);
