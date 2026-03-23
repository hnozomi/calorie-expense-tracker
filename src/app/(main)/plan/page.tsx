import { Suspense } from "react";
import { PlanCalendarView, PlanSkeleton } from "@/components/features/plan";

/** Meal plan calendar page */
export default function PlanPage() {
  return (
    <Suspense fallback={<PlanSkeleton />}>
      <PlanCalendarView />
    </Suspense>
  );
}
