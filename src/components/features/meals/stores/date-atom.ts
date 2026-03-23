import { atom } from "jotai";
import { getTodayString } from "@/utils";

/** Internal atom storing the raw selected date (empty string = today) */
const rawDateAtom = atom("");

/** Currently selected date for the daily view (defaults to today in local TZ) */
export const selectedDateAtom = atom(
  (get) => get(rawDateAtom) || getTodayString(),
  (_get, set, newDate: string) => set(rawDateAtom, newDate),
);
