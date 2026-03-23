"use client";

import { Target } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { useNutritionTarget, useSaveNutritionTarget } from "@/hooks";

/** Section for setting daily calorie and PFC targets */
const NutritionTargetSection = () => {
  const { data: target } = useNutritionTarget();
  const saveMutation = useSaveNutritionTarget();

  const [calories, setCalories] = useState(String(target.targetCalories));
  const [protein, setProtein] = useState(String(target.targetProtein));
  const [fat, setFat] = useState(String(target.targetFat));
  const [carbs, setCarbs] = useState(String(target.targetCarbs));

  /** Save the nutrition targets */
  const handleSave = useCallback(async () => {
    try {
      await saveMutation.mutateAsync({
        targetCalories: Number(calories) || 0,
        targetProtein: Number(protein) || 0,
        targetFat: Number(fat) || 0,
        targetCarbs: Number(carbs) || 0,
      });
      toast.success("目標値を保存しました");
    } catch {
      toast.error("保存に失敗しました");
    }
  }, [calories, protein, fat, carbs, saveMutation]);

  return (
    <section className="space-y-3">
      <SectionHeader icon={Target} label="1日の目標" />
      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="target-calories" className="text-xs font-medium">
            カロリー (kcal)
          </Label>
          <Input
            id="target-calories"
            type="number"
            inputMode="decimal"
            step="any"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="target-protein" className="text-xs font-medium">
              <span className="text-blue-600 dark:text-blue-400">P</span> (g)
            </Label>
            <Input
              id="target-protein"
              type="number"
              inputMode="decimal"
              step="any"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target-fat" className="text-xs font-medium">
              <span className="text-amber-600 dark:text-amber-400">F</span> (g)
            </Label>
            <Input
              id="target-fat"
              type="number"
              inputMode="decimal"
              step="any"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="target-carbs" className="text-xs font-medium">
              <span className="text-green-600 dark:text-green-400">C</span> (g)
            </Label>
            <Input
              id="target-carbs"
              type="number"
              inputMode="decimal"
              step="any"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
            />
          </div>
        </div>
        <Button
          className="w-full"
          onClick={handleSave}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "保存中..." : "保存"}
        </Button>
      </div>
    </section>
  );
};

export { NutritionTargetSection };
