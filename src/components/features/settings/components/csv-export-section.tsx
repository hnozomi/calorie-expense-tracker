"use client";
// Client because the period picker and export buttons are interactive

import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  CSV_EXPORT_PERIOD_LABELS,
  type CsvExportPeriod,
} from "@/components/features/settings/csv-export-config";
import { useCsvExport } from "@/components/features/settings/hooks/use-csv-export";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/utils";

const EXPORT_ITEMS = [
  { type: "meals" as const, label: "食事記録" },
  { type: "recipes" as const, label: "レシピ" },
  { type: "food_masters" as const, label: "食品マスタ" },
  { type: "set_menus" as const, label: "セットメニュー" },
] as const;

// Object.entries widens the keys to string; they are the CsvExportPeriod keys of the labels
const PERIOD_OPTIONS = Object.entries(CSV_EXPORT_PERIOD_LABELS) as [
  CsvExportPeriod,
  string,
][];

export const CsvExportSection = () => {
  const {
    isExporting,
    isExportingType,
    mealPeriod,
    setMealPeriod,
    exportByType,
  } = useCsvExport();

  return (
    <section className="space-y-3">
      <SectionHeader icon={Download} label="CSVエクスポート" />
      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        {/* Period selector applied to the meal export */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">食事記録の期間</span>
          <div className="flex gap-1 rounded-lg bg-muted/60 p-0.5">
            {PERIOD_OPTIONS.map(([period, label]) => (
              <button
                key={period}
                type="button"
                aria-pressed={mealPeriod === period}
                onClick={() => setMealPeriod(period)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                  mealPeriod === period
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/80",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {EXPORT_ITEMS.map(({ type, label }) => {
            return (
              <Button
                key={type}
                variant="outline"
                className="h-auto flex-col gap-1.5 bg-background/80 py-3"
                onClick={() => exportByType(type)}
                disabled={isExporting}
              >
                {isExportingType(type) ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5 text-primary/70" />
                )}
                <span className="text-xs font-medium">
                  {isExportingType(type) ? "エクスポート中..." : label}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
