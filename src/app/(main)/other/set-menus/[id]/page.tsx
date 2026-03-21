"use client";

import { useParams } from "next/navigation";
import { SetMenuFormView } from "@/components/features/set-menus";

/** Set menu create/edit page */
export default function SetMenuDetailPage() {
  const params = useParams<{ id: string }>();
  return <SetMenuFormView id={params.id} />;
}
