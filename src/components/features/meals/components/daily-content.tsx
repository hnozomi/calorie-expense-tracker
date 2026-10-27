import { getFoodMasters } from "@/components/features/food-masters/api/queries";
import { getRecipes } from "@/components/features/recipes/api/queries";
import { getSetMenus } from "@/components/features/set-menus/api/queries";
import { getNutritionTarget } from "@/components/features/settings/api/queries";
import {
  getDailyMeals,
  getDailySummary,
  getRecentMealItems,
} from "../api/queries";
import type { DrawerCandidates } from "../types/drawer-candidates";
import { DailyMealsProvider } from "./daily-meals-provider";
import { DailySummary } from "./daily-summary";
import { DateNavigator } from "./date-navigator";
import { MealRegisterDrawer } from "./meal-register-drawer";
import { MealSlotList } from "./meal-slot-list";

type Props = {
  date: string;
  today: string;
};

const readDrawerCandidates = async (): Promise<DrawerCandidates> => {
  const [recentItems, recipes, foodMasters, setMenus] = await Promise.all([
    getRecentMealItems(),
    getRecipes(),
    getFoodMasters(),
    getSetMenus(),
  ]);
  return { recentItems, recipes, foodMasters, setMenus };
};

/** One day of the home screen: the summary and slots wait for their data, the drawer's lists keep loading behind them */
export const DailyContent = async ({ date, today }: Props) => {
  // Not awaited: the drawer only needs the lists once it is opened
  const candidates = readDrawerCandidates();
  const [meals, summaryRows, target] = await Promise.all([
    getDailyMeals(date),
    getDailySummary(date),
    getNutritionTarget(),
  ]);

  return (
    <DailyMealsProvider date={date} today={today} meals={meals}>
      <DateNavigator date={date} today={today} />
      <DailySummary summaryRows={summaryRows} target={target} />
      <MealSlotList />
      <MealRegisterDrawer candidates={candidates} />
    </DailyMealsProvider>
  );
};
