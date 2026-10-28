"use client";
// Client because the file is built and downloaded in the browser

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { exportCsvRows } from "@/components/features/settings/api/actions";
import {
  buildCsvFilename,
  type CsvExportPeriod,
  type CsvExportType,
  csvExportDefinitions,
} from "@/components/features/settings/csv-export-config";
import { callAction } from "@/lib/action-result";
import { downloadCsv, toCsv } from "@/utils";

/** The rows are read on the server; the file is made and saved here */
export const useCsvExport = () => {
  const [exportingType, setExportingType] = useState<CsvExportType | null>(
    null,
  );
  const [mealPeriod, setMealPeriod] = useState<CsvExportPeriod>("all");
  const [, startExport] = useTransition();

  const exportByType = (type: CsvExportType) => {
    const definition = csvExportDefinitions[type];
    setExportingType(type);
    startExport(async () => {
      const result = await callAction(() =>
        exportCsvRows({ type, period: type === "meals" ? mealPeriod : "all" }),
      );
      setExportingType(null);
      if (!result.ok) {
        toast.error("エクスポートに失敗しました");
        return;
      }
      if (result.rows.length === 0) {
        toast.info("エクスポートするデータがありません");
        return;
      }
      downloadCsv(
        toCsv(definition.headers, result.rows),
        buildCsvFilename(definition.filenamePrefix),
      );
      toast.success(definition.successMessage);
    });
  };

  return {
    isExporting: exportingType !== null,
    isExportingType: (type: CsvExportType) => exportingType === type,
    mealPeriod,
    setMealPeriod,
    exportByType,
  };
};
