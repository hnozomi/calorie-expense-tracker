import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { planHref } from "@/components/features/plan/utils/plan-href";
import { Button } from "@/components/ui/button";
import { formatWeekLabel, shiftDate } from "@/utils";

type Props = {
  weekStart: string;
  thisMonday: string;
};

export const WeekNavigator = ({ weekStart, thisMonday }: Props) => {
  const isCurrentWeek = weekStart === thisMonday;

  return (
    <div className="relative flex items-center justify-center gap-2 py-4">
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
      >
        {/* The next and previous week are likely taps, and their plans have a private cache, so prefetch them */}
        <Link
          href={planHref(shiftDate(weekStart, -7), thisMonday)}
          prefetch
          aria-label="前の週"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>
      <span className="min-w-[140px] rounded-full bg-muted/60 px-4 py-1.5 text-center text-sm font-semibold tracking-wide">
        {isCurrentWeek && (
          <span className="mr-1.5 text-xs font-bold text-primary">今週</span>
        )}
        {formatWeekLabel(weekStart)}
      </span>
      <Button
        asChild
        variant="ghost"
        size="icon-sm"
        className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
      >
        <Link
          href={planHref(shiftDate(weekStart, 7), thisMonday)}
          prefetch
          aria-label="次の週"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
      {!isCurrentWeek && (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="absolute right-3 h-7 rounded-full px-2.5 text-xs"
        >
          <Link href={planHref(thisMonday, thisMonday)}>今週へ</Link>
        </Button>
      )}
    </div>
  );
};
