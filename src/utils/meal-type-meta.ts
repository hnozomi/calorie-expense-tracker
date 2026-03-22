import { ChefHat, Cookie, Egg, UtensilsCrossed } from "lucide-react";
import type { MealType } from "@/types";

type MealTypeMeta = {
  icon: React.ElementType;
  accent: string;
  iconBg: string;
};

/** Visual metadata for each meal type (icon, accent color, icon background) */
export const MEAL_TYPE_META: Record<MealType, MealTypeMeta> = {
  breakfast: {
    icon: Egg,
    accent: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  lunch: {
    icon: UtensilsCrossed,
    accent: "text-brand dark:text-brand",
    iconBg: "bg-brand-muted dark:bg-brand/20",
  },
  dinner: {
    icon: ChefHat,
    accent: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-100 dark:bg-rose-900/40",
  },
  snack: {
    icon: Cookie,
    accent: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-100 dark:bg-purple-900/40",
  },
};
