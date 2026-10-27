import { describe, expect, it } from "vitest";
import { applyPlanChange } from "@/components/features/plan/utils/apply-plan-change";
import { createPlan } from "./helpers/weekly-plans";

describe("applyPlanChange", () => {
  it("AC-R-5: a new plan is added to the week at once", () => {
    const kept = createPlan({ id: "kept" });
    const added = { ...createPlan({ id: "optimistic-1" }), isOptimistic: true };

    const plans = applyPlanChange([kept], { type: "save", plan: added });

    expect(plans.map((plan) => plan.id)).toEqual(["kept", "optimistic-1"]);
  });

  it("AC-R-5: an edited plan replaces the one with its id, in its place", () => {
    const first = createPlan({ id: "first", plannedName: "前" });
    const second = createPlan({ id: "second" });
    const edited = { ...first, plannedName: "後" };

    const plans = applyPlanChange([first, second], {
      type: "save",
      plan: edited,
    });

    expect(plans.map((plan) => [plan.id, plan.plannedName])).toEqual([
      ["first", "後"],
      ["second", second.plannedName],
    ]);
  });

  it("AC-R-5: a removed plan leaves the week at once", () => {
    const first = createPlan({ id: "first" });
    const second = createPlan({ id: "second" });

    const plans = applyPlanChange([first, second], {
      type: "remove",
      planId: "first",
    });

    expect(plans.map((plan) => plan.id)).toEqual(["second"]);
  });

  it("removing a plan that is not in the week changes nothing", () => {
    const first = createPlan({ id: "first" });

    expect(
      applyPlanChange([first], { type: "remove", planId: "other" }),
    ).toEqual([first]);
  });

  it("does not change the plans it was given", () => {
    const original = [createPlan({ id: "first" })];

    applyPlanChange(original, { type: "remove", planId: "first" });

    expect(original).toHaveLength(1);
  });
});
