import { Suspense } from "react";
import { DailySkeleton, DailyView } from "@/components/features/meals";

/** S-01: Home daily view page */
export default function HomePage() {
  return (
    <Suspense fallback={<DailySkeleton />}>
      <DailyView />
    </Suspense>
  );
}
