import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { PlanSection, PlanSkeleton } from "@/components/features/plan";

/** S-07: Plan calendar. The header shows at once; the week waits for ?week= inside Suspense */
const PlanPage = ({ searchParams }: PageProps<"/plan">) => {
  return (
    <>
      <Header title="献立カレンダー" />
      <PageContainer>
        <Suspense fallback={<PlanSkeleton />}>
          <PlanSection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default PlanPage;
