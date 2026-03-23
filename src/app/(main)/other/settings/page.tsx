import { Suspense } from "react";
import { SettingsSkeleton, SettingsView } from "@/components/features/settings";

/** Settings page */
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsView />
    </Suspense>
  );
}
