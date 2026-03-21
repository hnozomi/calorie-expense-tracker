import { atom } from "jotai";
import type { MealType } from "@/types";
import type { MealItemDraft } from "../types/meal";

/** Whether the meal register drawer is open */
export const isDrawerOpenAtom = atom(false);

/** Which meal slot the drawer is registering for */
export const drawerMealTypeAtom = atom<MealType>("breakfast");

/** Draft items accumulated in the registration card */
export const draftItemsAtom = atom<MealItemDraft[]>([]);
