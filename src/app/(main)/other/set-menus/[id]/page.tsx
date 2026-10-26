import { Suspense } from "react";
import {
  SetMenuFormSection,
  SetMenuFormSkeleton,
} from "@/components/features/set-menus";

type Props = {
  params: Promise<{ id: string }>;
};

/** Set menu create/edit page */
const SetMenuDetailPage = ({ params }: Props) => {
  return (
    <Suspense fallback={<SetMenuFormSkeleton />}>
      <SetMenuFormSection params={params} />
    </Suspense>
  );
};

export default SetMenuDetailPage;
