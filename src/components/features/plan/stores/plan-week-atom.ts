import { atom } from "jotai";
import { getThisMonday } from "@/utils";

/** Internal atom storing the raw week start (empty string = this week) */
const rawPlanWeekAtom = atom("");

/** Currently selected week start date for the plan calendar (defaults to this Monday) */
export const planWeekStartAtom = atom(
  (get) => get(rawPlanWeekAtom) || getThisMonday(),
  (_get, set, newDate: string) => set(rawPlanWeekAtom, newDate),
);
