"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelectedDateNavigation } from "@/hooks";
import { cn, formatDisplayDate } from "@/utils";
import { selectedDateAtom } from "../stores/date-atom";

/** Navigate between dates with left/right arrows */
const DateNavigator = () => {
  const {
    value: selectedDate,
    isDefaultValue,
    shiftBackward,
    shiftForward,
  } = useSelectedDateNavigation(selectedDateAtom);
  const displayDate = isDefaultValue ? "今日" : formatDisplayDate(selectedDate);

  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <Button
        variant="ghost"
        size="icon-sm"
        className="rounded-full transition-colors hover:bg-muted"
        onClick={shiftBackward}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div
        className={cn(
          "flex min-w-[100px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          isDefaultValue
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
        onClick={shiftForward}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export { DateNavigator };
