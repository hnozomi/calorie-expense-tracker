"use client";
// Client because the fields are typed into and saved with a Server Action

import { Target } from "lucide-react";
import { useNutritionTargetForm } from "@/components/features/settings/hooks/use-nutrition-target-form";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import type { NutritionTarget } from "@/types";
import { TargetField } from "./target-field";

type Props = {
  target: NutritionTarget;
};

export const NutritionTargetSection = ({ target }: Props) => {
  const {
    calories,
    handleCaloriesChange,
    protein,
    handleProteinChange,
    fat,
    handleFatChange,
    carbs,
    handleCarbsChange,
    fieldErrors,
    isSaving,
    handleSave,
  } = useNutritionTargetForm(target);

  return (
    <section className="space-y-3">
      <SectionHeader icon={Target} label="1日の目標" />
      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        <TargetField
          id="target-calories"
          label="カロリー (kcal)"
          value={calories}
          error={fieldErrors.calories}
          onChange={handleCaloriesChange}
        />
        <div className="grid grid-cols-3 gap-3">
          <TargetField
            id="target-protein"
            label={
              <>
                <span className="text-blue-600 dark:text-blue-400">P</span> (g)
              </>
            }
            value={protein}
            error={fieldErrors.protein}
            onChange={handleProteinChange}
          />
          <TargetField
            id="target-fat"
            label={
              <>
                <span className="text-amber-600 dark:text-amber-400">F</span>{" "}
                (g)
              </>
            }
            value={fat}
            error={fieldErrors.fat}
            onChange={handleFatChange}
          />
          <TargetField
            id="target-carbs"
            label={
              <>
                <span className="text-green-600 dark:text-green-400">C</span>{" "}
                (g)
              </>
            }
            value={carbs}
            error={fieldErrors.carbs}
            onChange={handleCarbsChange}
          />
        </div>
        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          {isSaving ? "保存中..." : "保存"}
        </Button>
      </div>
    </section>
  );
};
