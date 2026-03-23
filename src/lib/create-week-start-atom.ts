import { atom } from "jotai";
import { getThisMonday } from "@/utils";

/** Create a week-start atom that falls back to this Monday when empty */
export const createWeekStartAtom = () => {
  const rawWeekAtom = atom("");

  return atom(
    (get) => get(rawWeekAtom) || getThisMonday(),
    (_get, set, newDate: string) => set(rawWeekAtom, newDate),
  );
};
