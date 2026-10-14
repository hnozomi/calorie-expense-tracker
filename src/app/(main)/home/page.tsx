import { Suspense } from "react";
import { HydratedOnly } from "@/components/features/layout";
import { DailySkeleton, DailyView } from "@/components/features/meals";

/** S-01: Home daily view page */
export default function HomePage() {
  return (
    <HydratedOnly fallback={<DailySkeleton />}>
      <Suspense fallback={<DailySkeleton />}>
        <DailyView />
      </Suspense>
    </HydratedOnly>
  );
}
