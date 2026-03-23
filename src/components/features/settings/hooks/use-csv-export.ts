"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";
import { downloadCsv, toCsv } from "@/utils";
import {
  buildCsvFilename,
  type CsvExportType,
  csvExportDefinitions,
} from "../csv-export-config";

/** CSV export hook providing download functions for each data type */
export const useCsvExport = () => {
  const supabase = useSupabase();
  const [isExporting, setIsExporting] = useState(false);

  const exportByType = useCallback(
    async (type: CsvExportType) => {
      const definition = csvExportDefinitions[type];

      setIsExporting(true);
      try {
        const rows = await definition.fetchRows(supabase);
        const csv = toCsv(definition.headers, rows);
        downloadCsv(csv, buildCsvFilename(definition.filenamePrefix));
        toast.success(definition.successMessage);
      } catch (error) {
        console.error(`Failed to export ${type}:`, error);
        toast.error("エクスポートに失敗しました");
      } finally {
        setIsExporting(false);
      }
    },
    [supabase],
  );

  return { isExporting, exportByType };
};
