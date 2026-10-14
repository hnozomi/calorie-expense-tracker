import { Suspense } from "react";
import { HydratedOnly } from "@/components/features/layout";
import { ReportSkeleton, WeeklyReportView } from "@/components/features/report";

/** Weekly report page */
export default function ReportPage() {
  return (
    <HydratedOnly fallback={<ReportSkeleton />}>
      <Suspense fallback={<ReportSkeleton />}>
        <WeeklyReportView />
      </Suspense>
    </HydratedOnly>
  );
}
