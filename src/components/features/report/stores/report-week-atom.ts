import { atom } from "jotai";
import { getThisMonday } from "@/utils";

/** Internal atom storing the raw week start (empty string = this week) */
const rawReportWeekAtom = atom("");

/** Currently selected week start date for the weekly report (defaults to this Monday) */
export const reportWeekStartAtom = atom(
  (get) => get(rawReportWeekAtom) || getThisMonday(),
  (_get, set, newDate: string) => set(rawReportWeekAtom, newDate),
);
