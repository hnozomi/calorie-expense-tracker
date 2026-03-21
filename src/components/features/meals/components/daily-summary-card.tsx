"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailySummary } from "../hooks/use-daily-summary";
import type { DailySummaryRow } from "../types/meal";
import { sumNutrition } from "../utils/nutrition-calc";

type DailySummaryCardProps = {
  date: string;
};

/** Display total calories, PFC, and cost for the day */
const DailySummaryCard = ({ date }: DailySummaryCardProps) => {
  const { data: summaryRows, isLoading } = useDailySummary(date);

  if (isLoading) {
    return <Skeleton className="mx-4 h-24 rounded-xl" />;
  }

  const rows: DailySummaryRow[] = summaryRows ?? [];
  const nutrition = sumNutrition(rows);
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);

  const totals = { ...nutrition, cost: totalCost };

  return (
    <Card className="mx-4">
      <CardContent className="py-4">
        <div className="flex items-baseline justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round(totals.calories)}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium text-blue-600">
                {totals.protein.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">P</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-amber-600">
                {totals.fat.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">F</p>
            </div>
            <div className="text-center">
              <p className="font-medium text-green-600">
                {totals.carbs.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">C</p>
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium">¥{Math.round(totals.cost)}</p>
            <p className="text-xs text-muted-foreground">食費</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { DailySummaryCard };
