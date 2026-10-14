import { Suspense } from "react";
import { HydratedOnly } from "@/components/features/layout";
import { PlanCalendarView, PlanSkeleton } from "@/components/features/plan";

/** Meal plan calendar page */
export default function PlanPage() {
  return (
    <HydratedOnly fallback={<PlanSkeleton />}>
      <Suspense fallback={<PlanSkeleton />}>
        <PlanCalendarView />
      </Suspense>
    </HydratedOnly>
  );
}
