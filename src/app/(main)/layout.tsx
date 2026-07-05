import { BottomNavigation } from "@/components/features/layout";

/** Authenticated pages layout: bottom navigation */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      {children}
      <BottomNavigation />
    </div>
  );
}
