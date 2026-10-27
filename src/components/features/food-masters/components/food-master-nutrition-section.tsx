import { Flame, Sparkles } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { FoodMasterFormInput } from "@/components/features/food-masters/types/food-master";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PfcInputCard } from "@/components/ui/pfc-display";
import { SectionHeader } from "@/components/ui/section-header";

type Props = {
  register: UseFormRegister<FoodMasterFormInput>;
  errors: FieldErrors<FoodMasterFormInput>;
};

export const FoodMasterNutritionSection = ({ register, errors }: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Flame} label="栄養成分" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="fm-calories" className="text-xs">
          <Sparkles className="mr-1 inline-block h-3 w-3 text-amber-500" />
          カロリー (kcal)
        </Label>
        <Input
          id="fm-calories"
          aria-invalid={!!errors.calories}
          aria-describedby={errors.calories ? "fm-calories-error" : undefined}
          type="number"
          inputMode="decimal"
          step="any"
          className="text-lg font-semibold tracking-wide"
          placeholder="0"
          {...register("calories")}
        />
        {errors.calories && (
          <p id="fm-calories-error" className="text-xs text-destructive">
            {errors.calories.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <PfcInputCard
          id="fm-protein"
          nutrient="protein"
          error={errors.protein?.message}
          {...register("protein")}
        />
        <PfcInputCard
          id="fm-fat"
          nutrient="fat"
          error={errors.fat?.message}
          {...register("fat")}
        />
        <PfcInputCard
          id="fm-carbs"
          nutrient="carbs"
          error={errors.carbs?.message}
          {...register("carbs")}
        />
      </div>
    </div>
  </section>
);
