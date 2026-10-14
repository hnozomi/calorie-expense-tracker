import { Suspense } from "react";
import { HydratedOnly } from "@/components/features/layout";
import { SettingsSkeleton, SettingsView } from "@/components/features/settings";

/** Settings page */
export default function SettingsPage() {
  return (
    <HydratedOnly fallback={<SettingsSkeleton />}>
      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsView />
      </Suspense>
    </HydratedOnly>
  );
}
