"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";
import { downloadCsv, toCsv } from "@/utils";
import {
  buildCsvFilename,
  type CsvExportPeriod,
  type CsvExportType,
  csvExportDefinitions,
} from "../csv-export-config";

/** CSV export hook providing download functions for each data type */
export const useCsvExport = () => {
  const supabase = useSupabase();
  const [exportingType, setExportingType] = useState<CsvExportType | null>(
    null,
  );

  const exportByType = useCallback(
    async (type: CsvExportType, period: CsvExportPeriod = "all") => {
      const definition = csvExportDefinitions[type];

      setExportingType(type);
      try {
        const rows = await definition.fetchRows(supabase, period);
        if (rows.length === 0) {
          toast.info("エクスポートするデータがありません");
          return;
        }
        const csv = toCsv(definition.headers, rows);
        downloadCsv(csv, buildCsvFilename(definition.filenamePrefix));
        toast.success(definition.successMessage);
      } catch (error) {
        console.error(`Failed to export ${type}:`, error);
        toast.error("エクスポートに失敗しました");
      } finally {
        setExportingType(null);
      }
    },
    [supabase],
  );

  return { exportingType, exportByType };
};
