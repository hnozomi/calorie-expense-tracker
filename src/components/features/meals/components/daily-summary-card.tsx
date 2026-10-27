import { Flame, Wallet } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { NutritionTarget } from "@/types";
import type { DailySummaryRow } from "../types/meal";
import { sumNutrition } from "../utils/nutrition-calc";
import { CalorieRing } from "./calorie-ring";
import { PfcBars } from "./pfc-bars";

type Props = {
  summaryRows: DailySummaryRow[];
  target: NutritionTarget;
};

/** Display total calories, PFC, cost, and remaining intake for the day */
export const DailySummaryCard = ({ summaryRows, target }: Props) => {
  const nutrition = sumNutrition(summaryRows);
  const totalCost = summaryRows.reduce((sum, row) => sum + row.totalCost, 0);

  const { targetCalories, targetProtein, targetFat, targetCarbs } = target;
  const hasTarget = targetCalories > 0;

  const remainingCalories = Math.max(targetCalories - nutrition.calories, 0);

  return (
    <Card className="mx-4 overflow-hidden bg-gradient-to-br from-brand-muted to-brand-muted/50 shadow-md dark:from-brand-muted dark:to-brand-muted/50">
      <CardContent className="py-4">
        <div className="flex items-center gap-4">
          {/* Calorie ring or simple display */}
          {hasTarget ? (
            <CalorieRing current={nutrition.calories} target={targetCalories} />
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted dark:bg-brand/20">
                <Flame className="h-5 w-5 text-brand" />
              </div>
              <div>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">
                  {Math.round(nutrition.calories)}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  kcal
                </p>
                <Link
                  href="/other/settings"
                  className="mt-1 inline-block text-xs font-medium text-brand underline-offset-2 hover:underline"
                >
                  目標を設定する
                </Link>
              </div>
            </div>
          )}

          {/* Right side: remaining + cost */}
          <div className="flex-1">
            {hasTarget && (
              <div className="mb-1">
                <p className="text-xs text-muted-foreground">
                  あと
                  <span className="mx-1 text-base font-bold text-foreground">
                    {Math.round(remainingCalories)}
                  </span>
                  kcal
                </p>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 dark:bg-white/10">
              <Wallet className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-semibold">
                ¥{Math.round(totalCost).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <PfcBars
          nutrition={nutrition}
          targetProtein={targetProtein}
          targetFat={targetFat}
          targetCarbs={targetCarbs}
        />
      </CardContent>
    </Card>
  );
};
