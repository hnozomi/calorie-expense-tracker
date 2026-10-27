import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  label: string;
  isCurrentWeek: boolean;
  previousHref: string;
  nextHref: string;
  currentWeekHref: string;
};

/** Previous / next week links around the week's label, plus a jump back to this week */
export const WeekSwitcher = ({
  label,
  isCurrentWeek,
  previousHref,
  nextHref,
  currentWeekHref,
}: Props) => (
  <div className="relative flex items-center justify-center gap-2 py-4">
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
    >
      {/* The next and previous week are likely taps, and the screens read them with a private cache, so prefetch them */}
      <Link href={previousHref} prefetch aria-label="前の週">
        <ChevronLeft className="h-4 w-4" />
      </Link>
    </Button>
    <span className="min-w-[140px] rounded-full bg-muted/60 px-4 py-1.5 text-center text-sm font-semibold tracking-wide">
      {isCurrentWeek && (
        <span className="mr-1.5 text-xs font-bold text-primary">今週</span>
      )}
      {label}
    </span>
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className="h-8 w-8 rounded-full transition-colors hover:bg-muted"
    >
      <Link href={nextHref} prefetch aria-label="次の週">
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
        <Link href={currentWeekHref}>今週へ</Link>
      </Button>
    )}
  </div>
);
