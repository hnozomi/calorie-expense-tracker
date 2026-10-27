import { Suspense } from "react";
import { Header, PageContainer } from "@/components/features/layout";
import { DailySection, DailySkeleton } from "@/components/features/meals";

/** S-01: Home daily view. The header shows at once; the day waits for ?date= inside Suspense */
const HomePage = ({ searchParams }: PageProps<"/home">) => {
  return (
    <>
      <Header title="めしログ" />
      <PageContainer>
        <Suspense fallback={<DailySkeleton />}>
          <DailySection searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  );
};

export default HomePage;
