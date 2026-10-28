"use client";
// Client because the target fields are local state until saved

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { saveNutritionTarget } from "@/components/features/settings/api/actions";
import { callAction } from "@/lib/action-result";
import { useRefreshLegacyScreens } from "@/lib/legacy-bridge";
import type { NutritionTarget } from "@/types";

/** Build a validated numeric target field that rejects blanks and out-of-range values */
const targetFieldSchema = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, "入力してください")
    .transform(Number)
    .pipe(
      z
        .number("数値を入力してください")
        .min(min, `${min}以上で入力してください`)
        .max(max, `${max.toLocaleString()}以下で入力してください`),
    );

const targetFormSchema = z.object({
  calories: targetFieldSchema(1, 10000),
  protein: targetFieldSchema(0, 1000),
  fat: targetFieldSchema(0, 1000),
  carbs: targetFieldSchema(0, 2000),
});

type TargetFieldKey = keyof z.infer<typeof targetFormSchema>;

/** The four target fields as typed, checked when saved; target is read on the server */
export const useNutritionTargetForm = (target: NutritionTarget) => {
  const refreshLegacyScreens = useRefreshLegacyScreens();
  const [isSaving, startSaving] = useTransition();

  const [calories, setCalories] = useState(String(target.targetCalories));
  const [protein, setProtein] = useState(String(target.targetProtein));
  const [fat, setFat] = useState(String(target.targetFat));
  const [carbs, setCarbs] = useState(String(target.targetCarbs));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<TargetFieldKey, string>>
  >({});

  /** Validate and save the nutrition targets */
  const handleSave = () => {
    const parsed = targetFormSchema.safeParse({
      calories,
      protein,
      fat,
      carbs,
    });
    if (!parsed.success) {
      const nextErrors: Partial<Record<TargetFieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as TargetFieldKey;
        nextErrors[key] ??= issue.message;
      }
      setFieldErrors(nextErrors);
      return;
    }
    setFieldErrors({});

    startSaving(async () => {
      const result = await callAction(() =>
        saveNutritionTarget({
          targetCalories: parsed.data.calories,
          targetProtein: parsed.data.protein,
          targetFat: parsed.data.fat,
          targetCarbs: parsed.data.carbs,
        }),
      );
      if (!result.ok) {
        toast.error("保存に失敗しました");
        return;
      }
      toast.success("目標値を保存しました");
      refreshLegacyScreens();
    });
  };

  return {
    calories,
    handleCaloriesChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setCalories(event.target.value),
    protein,
    handleProteinChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setProtein(event.target.value),
    fat,
    handleFatChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setFat(event.target.value),
    carbs,
    handleCarbsChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setCarbs(event.target.value),
    fieldErrors,
    isSaving,
    handleSave,
  };
};
