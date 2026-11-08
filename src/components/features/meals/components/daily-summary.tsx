"use client";

// Client because the summary follows the items still being saved (useOptimistic) as well as the server's numbers

import { useDisplayedSummaryRows } from "@/components/features/meals/hooks/use-daily-meals-context";
import type { DailySummaryRow } from "@/components/features/meals/types/meal";
import type { NutritionTarget } from "@/types";
import { DailySummaryCard } from "./daily-summary-card";

type Props = {
  summaryRows: DailySummaryRow[];
  target: NutritionTarget;
};

export const DailySummary = ({ summaryRows, target }: Props) => {
  const displayedRows = useDisplayedSummaryRows(summaryRows);
  return <DailySummaryCard summaryRows={displayedRows} target={target} />;
};
