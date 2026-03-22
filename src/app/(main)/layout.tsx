import {
  BottomNavigation,
  NavigationProgress,
} from "@/components/features/layout";
import { Toaster } from "@/components/ui/sonner";

/** Authenticated pages layout: bottom navigation + toaster */
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <NavigationProgress />
      {children}
      <BottomNavigation />
      <Toaster position="top-center" richColors />
    </div>
  );
}
