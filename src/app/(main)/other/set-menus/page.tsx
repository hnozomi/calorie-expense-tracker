import { Suspense } from "react";
import {
  SetMenuListSkeleton,
  SetMenuListView,
} from "@/components/features/set-menus";

/** Set menus list page */
export default function SetMenusPage() {
  return (
    <Suspense fallback={<SetMenuListSkeleton />}>
      <SetMenuListView />
    </Suspense>
  );
}
