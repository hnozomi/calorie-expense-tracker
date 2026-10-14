import { Suspense } from "react";
import { HydratedOnly } from "@/components/features/layout";
import {
  SetMenuListSkeleton,
  SetMenuListView,
} from "@/components/features/set-menus";

/** Set menus list page */
export default function SetMenusPage() {
  return (
    <HydratedOnly fallback={<SetMenuListSkeleton />}>
      <Suspense fallback={<SetMenuListSkeleton />}>
        <SetMenuListView />
      </Suspense>
    </HydratedOnly>
  );
}
