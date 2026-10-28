import { act, render } from "@testing-library/react";
import { Suspense } from "react";
import type { FoodMaster } from "@/components/features/food-masters/types/food-master";
import { WeeklyPlansProvider } from "@/components/features/plan/components/weekly-plans-provider";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";
import type { PlanCandidates } from "@/components/features/plan/types/plan-candidates";
import type { Recipe } from "@/components/features/recipes/types/recipe";
import type { SetMenu } from "@/components/features/set-menus/types/set-menu";

export const createPlan = (overrides: Partial<MealPlan> = {}): MealPlan => ({
  id: crypto.randomUUID(),
  userId: "user-1",
  date: "2026-10-19",
  mealType: "breakfast",
  plannedName: "テストメニュー",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  calories: 500,
  protein: 20,
  fat: 15,
  carbs: 60,
  estimatedCost: 300,
  isTransferred: false,
  createdAt: "2026-10-18T00:00:00Z",
  ...overrides,
});

export const createRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
  id: "recipe-curry",
  userId: "user-1",
  name: "カレー",
  servings: 2,
  calories: 1200,
  protein: 40,
  fat: 30,
  carbs: 160,
  notes: null,
  deletedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ingredients: [
    {
      id: "ing-roux",
      recipeId: "recipe-curry",
      ingredientName: "ルー",
      quantity: 1,
      unit: "箱",
      unitPrice: 200,
    },
  ],
  ...overrides,
});

export const createFoodMaster = (
  overrides: Partial<FoodMaster> = {},
): FoodMaster => ({
  id: "fm-natto",
  userId: "user-1",
  name: "納豆",
  brand: "おかめ",
  category: null,
  calories: 90,
  protein: 8,
  fat: 5,
  carbs: 6,
  defaultPrice: 60,
  notes: null,
  deletedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  ...overrides,
});

export const createSetMenu = (overrides: Partial<SetMenu> = {}): SetMenu => ({
  id: "set-teishoku",
  userId: "user-1",
  name: "定食セット",
  totalCalories: 750,
  totalProtein: 30,
  totalFat: 20,
  totalCarbs: 100,
  totalCost: 650,
  deletedAt: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
  items: [],
  ...overrides,
});

export const candidatesOf = (
  overrides: Partial<PlanCandidates> = {},
): Promise<PlanCandidates> =>
  Promise.resolve({
    recipes: [],
    foodMasters: [],
    setMenus: [],
    hasError: false,
    ...overrides,
  });

export type WeeklyPlansOptions = {
  weekStart?: string;
  today?: string;
  plans?: MealPlan[];
  candidates?: Promise<PlanCandidates>;
};

/** The providers the plan screen puts around its client parts: the week's plans and candidates as PlanContent read them,
 *  and a Suspense boundary for the parts that use() the candidates */
export const createWeeklyPlansWrapper = ({
  weekStart = "2026-10-19",
  today = "2026-10-20",
  plans = [],
  candidates = candidatesOf(),
}: WeeklyPlansOptions = {}) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <WeeklyPlansProvider
      weekStart={weekStart}
      today={today}
      plans={plans}
      candidates={candidates}
    >
      <Suspense fallback={<p>候補を読み込み中</p>}>{children}</Suspense>
    </WeeklyPlansProvider>
  );
  return { Wrapper };
};

export const renderWithWeeklyPlans = (
  ui: React.ReactElement,
  options: WeeklyPlansOptions = {},
) => {
  const { Wrapper } = createWeeklyPlansWrapper(options);
  return render(ui, { wrapper: Wrapper });
};

/** Render and let React take up candidates that are already read. A promise React has not seen yet only
 *  re-renders the suspended part when the resolution is flushed inside act */
export const renderWithWeeklyPlansSettled = async (
  ui: React.ReactElement,
  options: WeeklyPlansOptions = {},
) => {
  let rendered: ReturnType<typeof renderWithWeeklyPlans> | undefined;
  await act(async () => {
    rendered = renderWithWeeklyPlans(ui, options);
  });
  if (!rendered) throw new Error("render did not run");
  return rendered;
};
