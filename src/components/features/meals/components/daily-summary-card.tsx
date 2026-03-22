"use client";

import { Flame, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PfcDisplay } from "@/components/ui/pfc-display";
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
    return <Skeleton className="mx-4 h-28 rounded-xl" />;
  }

  const rows: DailySummaryRow[] = summaryRows ?? [];
  const nutrition = sumNutrition(rows);
  const totalCost = rows.reduce((sum, row) => sum + row.totalCost, 0);

  const totals = { ...nutrition, cost: totalCost };

  return (
    <Card className="mx-4 overflow-hidden bg-gradient-to-br from-brand-muted to-brand-muted/50 shadow-md dark:from-brand-muted dark:to-brand-muted/50">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          {/* Calorie display */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-muted dark:bg-brand/20">
              <Flame className="h-5 w-5 text-brand" />
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground">
                {Math.round(totals.calories)}
              </p>
              <p className="text-xs font-medium text-muted-foreground">kcal</p>
            </div>
          </div>

          {/* Cost display */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 dark:bg-white/10">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold">
              ¥{Math.round(totals.cost).toLocaleString()}
            </span>
          </div>
        </div>

        {/* PFC breakdown */}
        <div className="mt-3 border-t border-brand-border pt-3 dark:border-brand-border">
          <PfcDisplay
            protein={totals.protein}
            fat={totals.fat}
            carbs={totals.carbs}
            size="md"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export { DailySummaryCard };
