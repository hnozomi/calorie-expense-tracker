import { Suspense } from "react";
import {
  SetMenuFormSection,
  SetMenuFormSkeleton,
} from "@/components/features/set-menus";

type SetMenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Set menu create/edit page */
export default function SetMenuDetailPage({ params }: SetMenuDetailPageProps) {
  return (
    <Suspense fallback={<SetMenuFormSkeleton />}>
      <SetMenuFormSection params={params} />
    </Suspense>
  );
}
