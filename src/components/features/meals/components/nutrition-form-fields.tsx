"use client";

import type { UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MealItemFormValues } from "../types/meal";

type NutritionFormFieldsProps = {
  register: UseFormRegister<MealItemFormValues>;
  errors: Partial<Record<keyof MealItemFormValues, { message?: string }>>;
  idPrefix?: string;
};

/** Shared form fields for calories, PFC, cost, and name */
const NutritionFormFields = ({
  register,
  errors,
  idPrefix = "",
}: NutritionFormFieldsProps) => {
  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : name);

  return (
    <>
      {/* Menu name */}
      <div className="space-y-1">
        <Label htmlFor={id("name")}>メニュー名</Label>
        <Input
          id={id("name")}
          placeholder="例: サラダチキン"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Calories and cost */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={id("calories")}>カロリー (kcal)</Label>
          <Input
            id={id("calories")}
            type="number"
            inputMode="decimal"
            step="any"
            {...register("calories")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={id("cost")}>食費 (円)</Label>
          <Input
            id={id("cost")}
            type="number"
            inputMode="decimal"
            {...register("cost")}
          />
        </div>
      </div>

      {/* PFC fields with color-coded backgrounds */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label
            htmlFor={id("protein")}
            className="text-blue-600 dark:text-blue-400"
          >
            P (g)
          </Label>
          <Input
            id={id("protein")}
            type="number"
            inputMode="decimal"
            step="any"
            className="border-blue-200 bg-blue-50/50 focus-visible:ring-blue-400 dark:border-blue-800 dark:bg-blue-950/30"
            {...register("protein")}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={id("fat")}
            className="text-amber-600 dark:text-amber-400"
          >
            F (g)
          </Label>
          <Input
            id={id("fat")}
            type="number"
            inputMode="decimal"
            step="any"
            className="border-amber-200 bg-amber-50/50 focus-visible:ring-amber-400 dark:border-amber-800 dark:bg-amber-950/30"
            {...register("fat")}
          />
        </div>
        <div className="space-y-1">
          <Label
            htmlFor={id("carbs")}
            className="text-green-600 dark:text-green-400"
          >
            C (g)
          </Label>
          <Input
            id={id("carbs")}
            type="number"
            inputMode="decimal"
            step="any"
            className="border-green-200 bg-green-50/50 focus-visible:ring-green-400 dark:border-green-800 dark:bg-green-950/30"
            {...register("carbs")}
          />
        </div>
      </div>
    </>
  );
};

export { NutritionFormFields };
