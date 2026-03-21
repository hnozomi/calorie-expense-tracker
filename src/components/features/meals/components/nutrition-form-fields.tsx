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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={id("calories")}>カロリー (kcal)</Label>
          <Input
            id={id("calories")}
            type="number"
            inputMode="decimal"
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

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor={id("protein")}>P (g)</Label>
          <Input
            id={id("protein")}
            type="number"
            inputMode="decimal"
            {...register("protein")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={id("fat")}>F (g)</Label>
          <Input
            id={id("fat")}
            type="number"
            inputMode="decimal"
            {...register("fat")}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={id("carbs")}>C (g)</Label>
          <Input
            id={id("carbs")}
            type="number"
            inputMode="decimal"
            {...register("carbs")}
          />
        </div>
      </div>
    </>
  );
};

export { NutritionFormFields };
