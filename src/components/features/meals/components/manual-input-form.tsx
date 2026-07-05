"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
  type PendingMealItemCollector,
} from "../types/meal";
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
    formState: { errors },
  } = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    // Empty defaults so the user can type immediately without clearing a "0"
    defaultValues: { name: "", calories: "", protein: "", fat: "", carbs: "" },
  });

  useEffect(() => {
    if (!pendingItemRef) return;
    pendingItemRef.current = () => {
      const parsed = mealItemFormSchema.safeParse(getValues());
      if (!parsed.success || !parsed.data.name.trim()) return null;
      return parsed.data;
    };
    return () => {
      pendingItemRef.current = null;
    };
  }, [pendingItemRef, getValues]);

  const handleAdd = (values: MealItemFormValues) => {
    onAdd(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleAdd)} className="space-y-3">
      <NutritionFormFields register={register} errors={errors} />

      <Button type="submit" variant="secondary" className="w-full">
        カードに追加
      </Button>
    </form>
  );
};

export { ManualInputForm };
