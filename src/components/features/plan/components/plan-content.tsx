import { getFoodMasters } from "@/components/features/food-masters/api/queries";
import { getRecipes } from "@/components/features/recipes/api/queries";
import { getSetMenus } from "@/components/features/set-menus/api/queries";
import { getNutritionTarget } from "@/components/features/settings/api/queries";
import { getWeeklyMealPlans } from "../api/queries";
import type { PlanCandidates } from "../types/plan-candidates";
import { PlanCalendarGrid } from "./plan-calendar-grid";
import { PlanWeeklySummary } from "./plan-weekly-summary";
import { ShoppingListButton } from "./shopping-list-button";
import { WeekNavigator } from "./week-navigator";
import { WeeklyPlansProvider } from "./weekly-plans-provider";

type Props = {
  weekStart: string;
  thisMonday: string;
  today: string;
};

// A failed read must not reject: the dialogs unwrap this with use(), and a rejection would replace the whole plan screen with the error page
const readPlanCandidates = async (): Promise<PlanCandidates> => {
  try {
    const [recipes, foodMasters, setMenus] = await Promise.all([
      getRecipes(),
      getFoodMasters(),
      getSetMenus(),
    ]);
    return { recipes, foodMasters, setMenus, hasError: false };
  } catch {
    return { recipes: [], foodMasters: [], setMenus: [], hasError: true };
  }
};

export const PlanContent = async ({ weekStart, thisMonday, today }: Props) => {
  // Not awaited: only the dialogs and the shopping list need the lists, once they are opened
  const candidates = readPlanCandidates();
  const [plans, target] = await Promise.all([
    getWeeklyMealPlans(weekStart),
    getNutritionTarget(),
  ]);

  return (
    <WeeklyPlansProvider
      weekStart={weekStart}
      today={today}
      plans={plans}
      candidates={candidates}
    >
      <WeekNavigator weekStart={weekStart} thisMonday={thisMonday} />
      <PlanCalendarGrid targetCalories={target.targetCalories} />
      <ShoppingListButton />
      <div className="px-4 pb-4 pt-3">
        <PlanWeeklySummary targetCalories={target.targetCalories} />
      </div>
    </WeeklyPlansProvider>
  );
};
