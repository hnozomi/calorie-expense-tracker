"use client";

import { useAtom } from "jotai";
import type { WritableAtom } from "jotai";
import { usePathname, useRouter } from "next/navigation";
import { getTodayString, shiftDate } from "@/utils";

type UseDateNavigationOptions = {
  atom: WritableAtom<string, [string], void>;
  paramName: string;
  defaultValue: string;
  stepDays: number;
  omitDefaultFromUrl?: boolean;
};

const useDateNavigation = ({
  atom,
  paramName,
  defaultValue,
  stepDays,
  omitDefaultFromUrl = false,
}: UseDateNavigationOptions) => {
  const [value, setValue] = useAtom(atom);
  const pathname = usePathname();
  const router = useRouter();

  const setDate = (nextValue: string) => {
    setValue(nextValue);
    const href =
      omitDefaultFromUrl && nextValue === defaultValue
        ? pathname
        : `${pathname}?${paramName}=${nextValue}`;
    router.replace(href, { scroll: false });
  };

  const shift = (direction: number) => {
    setDate(shiftDate(value, direction * stepDays));
  };

  return {
    value,
    isDefaultValue: value === defaultValue,
    setDate,
    shiftBackward: () => shift(-1),
    shiftForward: () => shift(1),
  };
};

export const useSelectedDateNavigation = (
  atom: WritableAtom<string, [string], void>,
) =>
  useDateNavigation({
    atom,
    paramName: "date",
    defaultValue: getTodayString(),
    stepDays: 1,
    omitDefaultFromUrl: true,
  });

export const useWeekStartNavigation = (
  atom: WritableAtom<string, [string], void>,
  defaultValue: string,
) =>
  useDateNavigation({
    atom,
    paramName: "weekStart",
    defaultValue,
    stepDays: 7,
  });
