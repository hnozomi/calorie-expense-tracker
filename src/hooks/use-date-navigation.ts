"use client";

import type { WritableAtom } from "jotai";
import { useAtom } from "jotai";
import { getTodayString, shiftDate } from "@/utils";

type UseDateNavigationOptions = {
  atom: WritableAtom<string, [string], void>;
  defaultValue: string;
  stepDays: number;
};

/** Hook for navigating dates via Jotai atom with shift support */
const useDateNavigation = ({
  atom,
  defaultValue,
  stepDays,
}: UseDateNavigationOptions) => {
  const [value, setValue] = useAtom(atom);

  const shift = (direction: number) => {
    setValue(shiftDate(value, direction * stepDays));
  };

  return {
    value,
    isDefaultValue: value === defaultValue,
    setDate: setValue,
    shiftBackward: () => shift(-1),
    shiftForward: () => shift(1),
  };
};

/** Date navigation for daily views (step: 1 day) */
export const useSelectedDateNavigation = (
  atom: WritableAtom<string, [string], void>,
) =>
  useDateNavigation({
    atom,
    defaultValue: getTodayString(),
    stepDays: 1,
  });

/** Date navigation for weekly views (step: 7 days) */
export const useWeekStartNavigation = (
  atom: WritableAtom<string, [string], void>,
  defaultValue: string,
) =>
  useDateNavigation({
    atom,
    defaultValue,
    stepDays: 7,
  });
