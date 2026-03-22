"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-3">
      <h3 className="text-sm font-medium">CSVエクスポート</h3>
      <div className="space-y-2">
        {EXPORT_ITEMS.map(({ type, label }) => (
          <Button
            key={type}
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => exportByType(type)}
            disabled={isExporting}
          >
            <Download className="h-4 w-4" />
            {label}をエクスポート
          </Button>
        ))}
      </div>
    </div>
  );
};

export { CsvExportSection };
