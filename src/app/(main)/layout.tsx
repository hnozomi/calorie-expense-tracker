import { Suspense } from "react";
import {
  BottomNavigation,
  BottomNavigationView,
  TabDataPrefetcher,
} from "@/components/features/layout";

type Props = {
  children: React.ReactNode;
};

/** Authenticated pages layout: bottom navigation + sibling-tab data prefetch */
const MainLayout = ({ children }: Props) => {
  return (
    <div className="flex min-h-dvh flex-col">
      {children}
      {/* Detail pages (/recipes/[id] etc.) have no path at build time, so their shell shows the tabs unhighlighted */}
      <Suspense fallback={<BottomNavigationView />}>
        <BottomNavigation />
      </Suspense>
      <TabDataPrefetcher />
    </div>
  );
};

export default MainLayout;
