import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanWeeklySummary } from "@/components/features/plan/components/plan-weekly-summary";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";

/** Mock useTransferPlan */
const mockMutateAsync = vi.fn();
vi.mock(
  "@/components/features/plan/hooks/use-transfer-plan",
  () => ({
    useTransferPlan: () => ({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  }),
);

afterEach(() => {
  cleanup();
  mockMutateAsync.mockClear();
});

/** Create a mock MealPlan */
const createPlan = (overrides: Partial<MealPlan> = {}): MealPlan => ({
  id: "plan-1",
  userId: "user-1",
  date: "2026-03-16",
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
  createdAt: "2026-03-15T00:00:00Z",
  ...overrides,
});

describe("PlanWeeklySummary", () => {
  it("renders week range label", () => {
    render(<PlanWeeklySummary plans={[]} weekStart="2026-03-16" />);
    expect(screen.getByText(/3\/16 - 3\/22/)).toBeInTheDocument();
  });

  it("displays zero totals when no plans", () => {
    render(<PlanWeeklySummary plans={[]} weekStart="2026-03-16" />);
    expect(screen.getByText("0 kcal")).toBeInTheDocument();
    expect(screen.getByText("¥0")).toBeInTheDocument();
  });

  it("calculates total calories from plans", () => {
    const plans = [
      createPlan({ id: "p1", calories: 500 }),
      createPlan({ id: "p2", calories: 700 }),
      createPlan({ id: "p3", calories: 300 }),
    ];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText("1500 kcal")).toBeInTheDocument();
  });

  it("calculates total cost from plans", () => {
    const plans = [
      createPlan({ id: "p1", estimatedCost: 300 }),
      createPlan({ id: "p2", estimatedCost: 450 }),
    ];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText("¥750")).toBeInTheDocument();
  });

  it("displays PFC totals", () => {
    const plans = [
      createPlan({ id: "p1", protein: 20, fat: 15, carbs: 60 }),
      createPlan({ id: "p2", protein: 30, fat: 10, carbs: 40 }),
    ];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText(/P:50\.0/)).toBeInTheDocument();
    expect(screen.getByText(/F:25\.0/)).toBeInTheDocument();
    expect(screen.getByText(/C:100\.0/)).toBeInTheDocument();
  });

  it("shows transfer button when untransferred plans exist", () => {
    const plans = [createPlan({ isTransferred: false })];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText("今日の献立を転記")).toBeInTheDocument();
  });

  it("hides transfer button when all plans are transferred", () => {
    const plans = [createPlan({ isTransferred: true })];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.queryByText("今日の献立を転記")).not.toBeInTheDocument();
  });

  it("shows untransferred count", () => {
    const plans = [
      createPlan({ id: "p1", isTransferred: false }),
      createPlan({ id: "p2", isTransferred: true }),
      createPlan({ id: "p3", isTransferred: false }),
    ];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText("未転記: 2件")).toBeInTheDocument();
  });

  it("hides untransferred count when all are transferred", () => {
    const plans = [createPlan({ isTransferred: true })];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.queryByText(/未転記/)).not.toBeInTheDocument();
  });

  it("rounds calorie totals", () => {
    const plans = [
      createPlan({ id: "p1", calories: 333.33 }),
      createPlan({ id: "p2", calories: 333.33 }),
      createPlan({ id: "p3", calories: 333.34 }),
    ];
    render(<PlanWeeklySummary plans={plans} weekStart="2026-03-16" />);
    expect(screen.getByText("1000 kcal")).toBeInTheDocument();
  });
});
