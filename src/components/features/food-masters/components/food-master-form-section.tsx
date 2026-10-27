import { notFound } from "next/navigation";
import { z } from "zod/v4";
import { getFoodMaster } from "@/components/features/food-masters/api/queries";
import { parsePrefillParams } from "@/components/features/food-masters/utils/parse-prefill";
import { FoodMasterFormView } from "./food-master-form-view";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// The id is only known per request, so it is read here inside the page's Suspense instead of at the top
// of the page, which would block the prerendered shell. An id that is not a uuid, unknown or deleted is a 404
export const FoodMasterFormSection = async ({
  params,
  searchParams,
}: Props) => {
  const { id } = await params;
  if (id === "new") {
    // The register drawer's save-to-master button passes the OCR values in the URL
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(await searchParams)) {
      if (typeof value === "string") query.set(key, value);
    }
    return <FoodMasterFormView prefill={parsePrefillParams(query)} />;
  }
  if (!z.uuid().safeParse(id).success) notFound();
  const foodMaster = await getFoodMaster(id);
  if (!foodMaster) notFound();
  return <FoodMasterFormView existing={foodMaster} prefill={{}} />;
};
