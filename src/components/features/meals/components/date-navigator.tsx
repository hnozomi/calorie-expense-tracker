"use client";
// Client because the date picker moves with the router

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useDateNavigator } from "../hooks/use-date-navigator";

type Props = {
  date: string;
  today: string;
};

/** Move between days with arrows, a native date picker, and a jump-to-today shortcut */
export const DateNavigator = ({ date, today }: Props) => {
  const {
    isToday,
    displayDate,
    previousHref,
    nextHref,
    todayHref,
    handleDatePicked,
  } = useDateNavigator(date, today);

  return (
    <div className="relative flex items-center justify-center gap-3 py-3">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="rounded-full transition-colors hover:bg-muted"
      >
        {/* The next and previous day are likely taps, and their data has a private cache, so prefetch them */}
        <Link href={previousHref} prefetch aria-label="前の日">
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </Button>
      <div
        className={cn(
          "relative flex min-w-[100px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isToday
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-foreground",
        )}
      >
        {displayDate}
        {/* Invisible native date input on top of the pill opens the OS picker on tap */}
        <input
          type="date"
          aria-label="日付を選択"
          value={date}
          onChange={handleDatePicked}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="rounded-full transition-colors hover:bg-muted"
      >
        <Link href={nextHref} prefetch aria-label="次の日">
          <ChevronRight className="h-5 w-5" />
        </Link>
      </Button>
      {!isToday && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="absolute right-3 h-7 rounded-full px-2.5 text-xs"
        >
          <Link href={todayHref}>今日へ</Link>
        </Button>
      )}
    </div>
  );
};
