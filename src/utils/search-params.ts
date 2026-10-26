import { getMondayOf, isValidDateString } from "./date";

export type ParsedDateParam =
  | { status: "absent" }
  | { status: "valid"; value: string }
  | { status: "invalid" };

/** Read a YYYY-MM-DD search param (?date=). A repeated param counts as invalid */
export const parseDateParam = (value: unknown): ParsedDateParam => {
  if (value === undefined) return { status: "absent" };
  if (typeof value !== "string" || !isValidDateString(value)) {
    return { status: "invalid" };
  }
  return { status: "valid", value };
};

/** Read a week search param (?week=), moved to the Monday of that week */
export const parseWeekParam = (value: unknown): ParsedDateParam => {
  const parsed = parseDateParam(value);
  return parsed.status === "valid"
    ? { status: "valid", value: getMondayOf(parsed.value) }
    : parsed;
};
