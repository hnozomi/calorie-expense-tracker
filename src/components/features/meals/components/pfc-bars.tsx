import type { NutritionValues } from "@/types";
import { PfcBar } from "./pfc-bar";

type Props = {
  nutrition: NutritionValues;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
};

export const PfcBars = ({
  nutrition,
  targetProtein,
  targetFat,
  targetCarbs,
}: Props) => (
  <div className="mt-3 space-y-2 border-t border-brand-border pt-3 dark:border-brand-border">
    <PfcBar
      label="P たんぱく質"
      current={nutrition.protein}
      target={targetProtein}
      color="bg-blue-500"
      bgColor="bg-blue-200/60 dark:bg-blue-900/30"
      textColor="text-blue-600 dark:text-blue-400"
    />
    <PfcBar
      label="F 脂質"
      current={nutrition.fat}
      target={targetFat}
      color="bg-amber-500"
      bgColor="bg-amber-200/60 dark:bg-amber-900/30"
      textColor="text-amber-600 dark:text-amber-400"
    />
    <PfcBar
      label="C 炭水化物"
      current={nutrition.carbs}
      target={targetCarbs}
      color="bg-green-500"
      bgColor="bg-green-200/60 dark:bg-green-900/30"
      textColor="text-green-600 dark:text-green-400"
    />
  </div>
);
