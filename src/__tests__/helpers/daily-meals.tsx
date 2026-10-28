import { render } from "@testing-library/react";
import { createStore, Provider as JotaiProvider } from "jotai";
import { DailyMealsProvider } from "@/components/features/meals/components/daily-meals-provider";
import type {
  DailyMealGroup,
  MealItem,
} from "@/components/features/meals/types/meal";

export const createMealItem = (
  overrides: Partial<MealItem> = {},
): MealItem => ({
  id: crypto.randomUUID(),
  mealId: "meal-1",
  name: "サラダチキン",
  calories: 120,
  protein: 25,
  fat: 2,
  carbs: 1,
  cost: 250,
  sourceType: "manual",
  recipeId: null,
  foodMasterId: null,
  setMenuId: null,
  servingQuantity: 1,
  sortOrder: 0,
  createdAt: "2026-10-20T00:00:00Z",
  updatedAt: "2026-10-20T00:00:00Z",
  ...overrides,
});

export const emptyDailyMeals = (): DailyMealGroup => ({
  breakfast: { mealId: null, items: [] },
  lunch: { mealId: null, items: [] },
  dinner: { mealId: null, items: [] },
  snack: { mealId: null, items: [] },
});

export type DailyMealsOptions = {
  date?: string;
  today?: string;
  meals?: DailyMealGroup;
};

/** The providers the home screen puts around its client parts: the day's meals as the server read them,
 *  and Jotai (drawer state) */
export const createDailyMealsWrapper = ({
  date = "2026-10-20",
  today = "2026-10-20",
  meals = emptyDailyMeals(),
}: DailyMealsOptions = {}) => {
  const store = createStore();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <JotaiProvider store={store}>
      <DailyMealsProvider date={date} today={today} meals={meals}>
        {children}
      </DailyMealsProvider>
    </JotaiProvider>
  );
  return { Wrapper, store };
};

export const renderWithDailyMeals = (
  ui: React.ReactElement,
  options: DailyMealsOptions = {},
) => {
  const { Wrapper, store } = createDailyMealsWrapper(options);
  return { ...render(ui, { wrapper: Wrapper }), store };
};

/** A promise the test settles by hand, to look at the screen while a Server Action is still running */
export const deferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
