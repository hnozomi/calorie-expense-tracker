"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelectedDateNavigation } from "@/hooks";
import {
  cn,
  formatDisplayDate,
  getTodayString,
  isValidDateString,
} from "@/utils";
import { selectedDateAtom } from "../stores/date-atom";

/** Navigate between dates with arrows, a native date picker, and a jump-to-today shortcut */
const DateNavigator = () => {
  const {
    value: selectedDate,
    isDefaultValue,
    setDate,
    shiftBackward,
    shiftForward,
  } = useSelectedDateNavigation(selectedDateAtom);
  const displayDate = isDefaultValue ? "今日" : formatDisplayDate(selectedDate);

  /** Apply a date chosen from the native picker */
  const handleDatePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.value;
    if (picked && isValidDateString(picked)) setDate(picked);
  };

  return (
    <div className="relative flex items-center justify-center gap-3 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="前の日"
        className="rounded-full transition-colors hover:bg-muted"
        onClick={shiftBackward}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div
        className={cn(
          "relative flex min-w-[100px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isDefaultValue
            ? "bg-primary text-primary-foreground shadow-sm"
            : "bg-muted text-foreground",
        )}
      >
        {displayDate}
        {/* Invisible native date input on top of the pill opens the OS picker on tap */}
        <input
          type="date"
          aria-label="日付を選択"
          value={selectedDate}
          onChange={handleDatePicked}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="次の日"
        className="rounded-full transition-colors hover:bg-muted"
        onClick={shiftForward}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      {!isDefaultValue && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-3 h-7 rounded-full px-2.5 text-xs"
          onClick={() => setDate(getTodayString())}
        >
          今日へ
        </Button>
      )}
    </div>
  );
};

export { DateNavigator };
