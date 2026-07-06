import type { SourceType } from "@/types";

/** A previously registered item, reusable for quick re-adding */
export type RecentMealItem = {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  cost: number | null;
  sourceType: SourceType;
  recipeId: string | null;
  foodMasterId: string | null;
  setMenuId: string | null;
};

/** Keep only the most recent entry per item name (input must be newest-first) */
export const dedupeRecentItemsByName = (
  items: RecentMealItem[],
  limit: number,
): RecentMealItem[] => {
  const seenNames = new Set<string>();
  const deduped: RecentMealItem[] = [];
  for (const item of items) {
    const key = item.name.trim();
    if (!key || seenNames.has(key)) continue;
    seenNames.add(key);
    deduped.push(item);
    if (deduped.length >= limit) break;
  }
  return deduped;
};
