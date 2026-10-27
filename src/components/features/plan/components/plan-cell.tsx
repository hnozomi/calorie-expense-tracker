"use client";
// Client because it opens the plan dialog for its cell

import { Plus } from "lucide-react";
import { Suspense } from "react";
import { usePlanCell } from "@/components/features/plan/hooks/use-plan-cell";
import type { DisplayedMealPlan } from "@/components/features/plan/types/meal-plan";
import type { MealType } from "@/types";
import { PlanMenuSelectModal } from "./plan-menu-select-modal";

type Props = {
  date: string;
  mealType: MealType;
  plans: DisplayedMealPlan[];
};

export const PlanCell = ({ date, mealType, plans }: Props) => {
  const {
    isModalOpen,
    hasOpenedModal,
    selectedPlan,
    handleOpenNew,
    handleOpenEdit,
    closeModal,
    reopenModal,
  } = usePlanCell();

  return (
    <>
      <div className="flex h-full min-h-[68px] min-w-0 flex-col gap-1 overflow-hidden p-1.5">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="block w-full truncate rounded-md bg-primary/8 px-1.5 py-2 text-left text-[11px] font-medium leading-tight text-foreground transition-colors hover:bg-primary/15 disabled:opacity-60"
            // Still being saved: it has no id to edit yet
            disabled={plan.isOptimistic}
            onClick={() => handleOpenEdit(plan)}
          >
            {plan.plannedName}
          </button>
        ))}
        {/* flex-1 lets the add button absorb the empty cell area for a larger tap target */}
        <button
          type="button"
          aria-label="献立を追加"
          className="mt-auto flex min-h-[28px] flex-1 items-center justify-center rounded-md border border-dashed border-border/50 py-1.5 text-muted-foreground/60 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          onClick={handleOpenNew}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {hasOpenedModal && (
        // Local boundary so the modal's suspense queries never bubble up
        // and swap the whole page back to its skeleton
        <Suspense fallback={null}>
          <PlanMenuSelectModal
            isOpen={isModalOpen}
            onClose={closeModal}
            onReopen={reopenModal}
            date={date}
            mealType={mealType}
            existingPlan={selectedPlan}
          />
        </Suspense>
      )}
    </>
  );
};
