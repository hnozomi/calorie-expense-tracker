"use client";

import { useRouter } from "next/navigation";
import { formatDisplayDate, isValidDateString, shiftDate } from "@/utils";
import { homeHref } from "../utils/home-href";

/** Links to the previous and next day, and moving to a day picked in the OS date picker */
export const useDateNavigator = (date: string, today: string) => {
  const router = useRouter();
  const isToday = date === today;

  /** The picker has no link to follow, so move with the router (it still adds a history entry for back) */
  const handleDatePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.value;
    if (picked && isValidDateString(picked)) {
      router.push(homeHref(picked, today));
    }
  };

  return {
    isToday,
    displayDate: isToday ? "今日" : formatDisplayDate(date),
    previousHref: homeHref(shiftDate(date, -1), today),
    nextHref: homeHref(shiftDate(date, 1), today),
    todayHref: homeHref(today, today),
    handleDatePicked,
  };
};
