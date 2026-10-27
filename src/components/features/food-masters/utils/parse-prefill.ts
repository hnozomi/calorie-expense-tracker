import type { FoodMasterFormValues } from "@/components/features/food-masters/types/food-master";

/** Parse prefill values passed via query params (e.g. OCR result on the "new" route) */
export const parsePrefillParams = (
  params: URLSearchParams,
): Partial<FoodMasterFormValues> => {
  const prefill: Partial<FoodMasterFormValues> = {};

  const name = params.get("name");
  if (name) prefill.name = name;

  const numericKeys = [
    "calories",
    "protein",
    "fat",
    "carbs",
    "defaultPrice",
  ] as const;
  for (const key of numericKeys) {
    const raw = params.get(key);
    if (raw === null) continue;
    const value = Number(raw);
    if (!Number.isNaN(value) && value >= 0) prefill[key] = value;
  }

  return prefill;
};
