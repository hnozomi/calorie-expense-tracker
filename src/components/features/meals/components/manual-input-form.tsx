"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { usePendingMealItem } from "@/components/features/meals/hooks/use-pending-meal-item";
import {
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
  type PendingMealItemCollector,
} from "@/components/features/meals/types/meal";
import { Button } from "@/components/ui/button";
import { NutritionFormFields } from "./nutrition-form-fields";

type ManualInputFormProps = {
  onAdd: (values: MealItemFormValues) => void;
  /** Lets the drawer detect typed-but-unadded input at register/close time */
  pendingItemRef?: React.MutableRefObject<PendingMealItemCollector | null>;
};

/** Form for manually entering a meal item's name, calories, PFC, and cost */
const ManualInputForm = ({ onAdd, pendingItemRef }: ManualInputFormProps) => {
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    // Empty defaults so the user can type immediately without clearing a "0"
    defaultValues: { name: "", calories: "", protein: "", fat: "", carbs: "" },
  });

  const nameValue = useWatch({ control, name: "name" });
  const canAdd = typeof nameValue === "string" && nameValue.trim().length > 0;

  usePendingMealItem(pendingItemRef, getValues);

  const handleAdd = (values: MealItemFormValues) => {
    onAdd(values);
    reset();
    // Close the soft keyboard so the updated draft card becomes visible
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleAdd)} className="space-y-3">
      <NutritionFormFields register={register} errors={errors} />

      <Button type="submit" className="w-full" disabled={!canAdd}>
        カードに追加
      </Button>
    </form>
  );
};

export { ManualInputForm };
