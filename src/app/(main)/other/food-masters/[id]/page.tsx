"use client";

import { useParams } from "next/navigation";
import { FoodMasterFormView } from "@/components/features/food-masters";

/** Food master create/edit page */
export default function FoodMasterDetailPage() {
  const params = useParams<{ id: string }>();
  return <FoodMasterFormView id={params.id} />;
}
