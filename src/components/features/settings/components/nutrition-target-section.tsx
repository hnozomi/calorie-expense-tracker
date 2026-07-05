"use client";

import { Target } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { useNutritionTarget, useSaveNutritionTarget } from "@/hooks";

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

/** Section for setting daily calorie and PFC targets */
const NutritionTargetSection = () => {
  const { data: target } = useNutritionTarget();
  const saveMutation = useSaveNutritionTarget();

  const [calories, setCalories] = useState(String(target.targetCalories));
  const [protein, setProtein] = useState(String(target.targetProtein));
  const [fat, setFat] = useState(String(target.targetFat));
  const [carbs, setCarbs] = useState(String(target.targetCarbs));
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<TargetFieldKey, string>>
  >({});

  /** Validate and save the nutrition targets */
  const handleSave = useCallback(async () => {
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

    try {
      await saveMutation.mutateAsync({
        targetCalories: parsed.data.calories,
        targetProtein: parsed.data.protein,
        targetFat: parsed.data.fat,
        targetCarbs: parsed.data.carbs,
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
            aria-invalid={!!fieldErrors.calories}
          />
          {fieldErrors.calories && (
            <p className="text-xs text-destructive">{fieldErrors.calories}</p>
          )}
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
              aria-invalid={!!fieldErrors.protein}
            />
            {fieldErrors.protein && (
              <p className="text-xs text-destructive">{fieldErrors.protein}</p>
            )}
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
              aria-invalid={!!fieldErrors.fat}
            />
            {fieldErrors.fat && (
              <p className="text-xs text-destructive">{fieldErrors.fat}</p>
            )}
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
              aria-invalid={!!fieldErrors.carbs}
            />
            {fieldErrors.carbs && (
              <p className="text-xs text-destructive">{fieldErrors.carbs}</p>
            )}
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
