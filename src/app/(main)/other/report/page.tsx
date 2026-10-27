import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { ReportSection, ReportSkeleton } from "@/components/features/report";

/** S-09: Weekly report. The header shows at once; the week waits for ?week= inside Suspense */
const ReportPage = ({ searchParams }: PageProps<"/other/report">) => {
  return (
    <>
      <Header title="ウィークリーレポート" />
      <PageContainer>
        <Suspense fallback={<ReportSkeleton />}>
          <ReportSection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default ReportPage;
