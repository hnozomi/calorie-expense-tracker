import { z } from "zod/v4";

// The same rules as the re-check in import_health_daily (its migration), so a body that passes here is not
// refused there: a refusal there only says invalid_records, while these issues tell the sender what to fix
const MAX_IMPORT_RECORDS = 100;

// The shortest decimal form, which is also what JSON.stringify sends to the function
const decimalPlaces = (value: number): number =>
  String(value).split(".")[1]?.length ?? 0;

const metricValue = (min: number, max: number, maxDecimals?: number) => {
  const inRange = z.number().min(min).max(max);
  if (maxDecimals === undefined) return inRange;
  return inRange.refine((value) => decimalPlaces(value) <= maxDecimals, {
    message: `At most ${maxDecimals} decimal places`,
  });
};

const metricsSchema = z
  .strictObject({
    weight_kg: metricValue(20, 300, 2).optional(),
    body_fat_pct: metricValue(1, 75, 1).optional(),
    steps: metricValue(0, 200000, 0).optional(),
    // Rounded to a whole number by the function, so any decimals are fine
    active_energy_kcal: metricValue(0, 10000).optional(),
  })
  .refine((metrics) => Object.keys(metrics).length > 0, {
    message: "At least one metric",
  });

type Metric = keyof z.infer<typeof metricsSchema>;

// ISO 8601 with Z or an offset, as the function accepts it
const MEASURED_AT_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:\d{2})$/;

const recordSchema = z.strictObject({
  date: z.iso.date(),
  source: z.enum(["withings", "apple_health"]),
  metrics: metricsSchema,
  measured_at: z
    .string()
    .regex(MEASURED_AT_PATTERN, "ISO 8601 with a time zone")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Not a real time")
    .nullable()
    .optional(),
});

const importBodySchema = (today: string) =>
  z.object({
    records: z
      .array(
        recordSchema.refine((record) => record.date <= today, {
          message: "The date is after today in Japan",
          path: ["date"],
        }),
      )
      .min(1)
      .max(MAX_IMPORT_RECORDS)
      .superRefine((records, context) => {
        const seen = new Set<string>();
        records.forEach((record, index) => {
          for (const metric of Object.keys(record.metrics) as Metric[]) {
            const key = `${record.date}/${record.source}/${metric}`;
            if (seen.has(key)) {
              context.addIssue({
                code: "custom",
                message: "The same date, source and metric appear twice",
                path: [index, "metrics", metric],
              });
            }
            seen.add(key);
          }
        });
      }),
  });

export type HealthImportRecord = z.infer<typeof recordSchema>;

export type ImportIssue = { path: string; message: string };

type ParsedImportBody =
  | { kind: "ok"; records: HealthImportRecord[] }
  | { kind: "too_large" }
  | { kind: "invalid"; issues: ImportIssue[] };

/** Check an import body. today is the date in Japan (YYYY-MM-DD); records after it are refused */
export const parseImportBody = (
  body: unknown,
  today: string,
): ParsedImportBody => {
  // More than 100 records is "too large" (413), not a wrong shape, so it is told apart before the full check
  if (
    typeof body === "object" &&
    body !== null &&
    "records" in body &&
    Array.isArray(body.records) &&
    body.records.length > MAX_IMPORT_RECORDS
  ) {
    return { kind: "too_large" };
  }

  const parsed = importBodySchema(today).safeParse(body);
  if (!parsed.success) {
    return {
      kind: "invalid",
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.map(String).join("."),
        message: issue.message,
      })),
    };
  }
  return { kind: "ok", records: parsed.data.records };
};
