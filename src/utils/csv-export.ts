/** Escape a CSV field value (wrap in quotes if contains comma, quote, or newline) */
const escapeField = (value: string | number | null | undefined): string => {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/** Convert an array of objects to CSV string with BOM for Excel compatibility */
export const toCsv = <T extends Record<string, unknown>>(
  headers: { key: keyof T; label: string }[],
  rows: T[],
): string => {
  const headerLine = headers.map((h) => escapeField(h.label)).join(",");
  const dataLines = rows.map((row) =>
    headers
      .map((h) => escapeField(row[h.key] as string | number | null))
      .join(","),
  );
  return `\uFEFF${headerLine}\n${dataLines.join("\n")}`;
};

/** Trigger a CSV file download in the browser */
export const downloadCsv = (csv: string, filename: string): void => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
