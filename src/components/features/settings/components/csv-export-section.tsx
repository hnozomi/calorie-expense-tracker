"use client";

import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useCsvExport } from "../hooks/use-csv-export";

const EXPORT_ITEMS = [
  { type: "meals" as const, label: "食事記録" },
  { type: "recipes" as const, label: "レシピ" },
  { type: "food_masters" as const, label: "食品マスタ" },
  { type: "set_menus" as const, label: "セットメニュー" },
] as const;

/** Section for CSV export buttons */
const CsvExportSection = () => {
  const { isExporting, exportByType } = useCsvExport();

  return (
    <section className="space-y-3">
      <SectionHeader icon={Download} label="CSVエクスポート" />
      <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-border/60 bg-muted/30 p-3.5">
        {EXPORT_ITEMS.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            className="h-auto flex-col gap-1.5 bg-background/80 py-3"
            onClick={() => exportByType(type)}
            disabled={isExporting}
          >
            <FileSpreadsheet className="h-5 w-5 text-primary/70" />
            <span className="text-xs font-medium">{label}</span>
          </Button>
        ))}
      </div>
    </section>
  );
};

export { CsvExportSection };
