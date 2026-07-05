import {
  BottomNavigation,
  TabDataPrefetcher,
} from "@/components/features/layout";

/** Authenticated pages layout: bottom navigation + sibling-tab data prefetch */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {children}
      <BottomNavigation />
      <TabDataPrefetcher />
    </div>
  );
}
