import { Suspense } from "react";
import {
  SetMenuFormSkeleton,
  SetMenuFormView,
} from "@/components/features/set-menus";

type SetMenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Set menu create/edit page */
export default async function SetMenuDetailPage({
  params,
}: SetMenuDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<SetMenuFormSkeleton />}>
      <SetMenuFormView id={id} />
    </Suspense>
  );
}
