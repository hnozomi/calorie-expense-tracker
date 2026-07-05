"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  type MealItemFormInput,
  type MealItemFormValues,
  mealItemFormSchema,
} from "../types/meal";
import { NutritionFormFields } from "./nutrition-form-fields";

type ManualInputFormProps = {
  onAdd: (values: MealItemFormValues) => void;
};

/** Form for manually entering a meal item's name, calories, PFC, and cost */
const ManualInputForm = ({ onAdd }: ManualInputFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealItemFormInput, undefined, MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema),
    // Empty defaults so the user can type immediately without clearing a "0"
    defaultValues: { name: "", calories: "", protein: "", fat: "", carbs: "" },
  });

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
