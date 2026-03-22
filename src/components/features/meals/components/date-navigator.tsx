"use client";

import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { formatDate, getToday, selectedDateAtom } from "../stores/date-atom";

/** Navigate between dates with left/right arrows */
const DateNavigator = () => {
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);

  const shift = (days: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDate(current));
  };

  const isToday = selectedDate === getToday();

  const displayDate = (() => {
    if (isToday) return "今日";
    const d = new Date(`${selectedDate}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）`;
  })();

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full transition-colors hover:bg-muted"
        onClick={() => shift(-1)}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div
        className={cn(
          "flex min-w-[100px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isToday
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-foreground",
        )}
      >
        {displayDate}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full transition-colors hover:bg-muted"
        onClick={() => shift(1)}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export { DateNavigator };
