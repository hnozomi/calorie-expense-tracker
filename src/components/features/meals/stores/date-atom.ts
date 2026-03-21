import { atom } from "jotai";

/** Format a Date to YYYY-MM-DD string */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Get today's date in local timezone as YYYY-MM-DD */
const getToday = (): string => formatDate(new Date());

/** Internal atom storing the raw selected date (empty string = today) */
const rawDateAtom = atom("");

/** Currently selected date for the daily view (defaults to today in local TZ) */
export const selectedDateAtom = atom(
  (get) => get(rawDateAtom) || getToday(),
  (_get, set, newDate: string) => set(rawDateAtom, newDate),
);

export { formatDate, getToday };
