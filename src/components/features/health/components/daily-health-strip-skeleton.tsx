import { Skeleton } from "@/components/ui/skeleton";

// h-10 matches DailyHealthStripView, so the band replaces it without moving the slots below
export const DailyHealthStripSkeleton = () => (
  <Skeleton className="mx-4 h-10 rounded-lg" />
);
