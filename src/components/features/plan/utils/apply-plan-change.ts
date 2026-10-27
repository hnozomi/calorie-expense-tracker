import type {
  DisplayedMealPlan,
  PlanChange,
} from "@/components/features/plan/types/meal-plan";

/** Show a change right away: a saved plan replaces the one with its id, or is added */
export const applyPlanChange = (
  plans: DisplayedMealPlan[],
  change: PlanChange,
): DisplayedMealPlan[] => {
  switch (change.type) {
    case "save":
      return plans.some((plan) => plan.id === change.plan.id)
        ? plans.map((plan) => (plan.id === change.plan.id ? change.plan : plan))
        : [...plans, change.plan];
    case "remove":
      return plans.filter((plan) => plan.id !== change.planId);
  }
};
