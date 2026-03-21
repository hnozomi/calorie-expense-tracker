"use client";

import { useAtom } from "jotai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, getToday, selectedDateAtom } from "../stores/date-atom";

/** Navigate between dates with left/right arrows */
const DateNavigator = () => {
  const [selectedDate, setSelectedDate] = useAtom(selectedDateAtom);

  const shift = (days: number) => {
    const current = new Date(`${selectedDate}T00:00:00`);
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDate(current));
  };

  const displayDate = (() => {
    const today = getToday();
    if (selectedDate === today) return "今日";
    const d = new Date(`${selectedDate}T00:00:00`);
    return `${d.getMonth() + 1}/${d.getDate()}（${"日月火水木金土"[d.getDay()]}）`;
  })();

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <Button variant="ghost" size="icon-sm" onClick={() => shift(-1)}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <span className="min-w-[80px] text-center font-medium">
        {displayDate}
      </span>
      <Button variant="ghost" size="icon-sm" onClick={() => shift(1)}>
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export { DateNavigator };
