import { Suspense } from "react";
import { ReportSkeleton, WeeklyReportView } from "@/components/features/report";

/** Weekly report page */
export default function ReportPage() {
  return (
    <Suspense fallback={<ReportSkeleton />}>
      <WeeklyReportView />
    </Suspense>
  );
}
