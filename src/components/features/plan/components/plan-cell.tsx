"use client";

import { Plus } from "lucide-react";
import { Suspense, useState } from "react";
import type { MealType } from "@/types";
import type { MealPlan } from "../types/meal-plan";
import { PlanMenuSelectModal } from "./plan-menu-select-modal";

type PlanCellProps = {
  date: string;
  mealType: MealType;
  plans: MealPlan[];
};

/** A single cell in the plan calendar grid (one date + one meal type) */
const PlanCell = ({ date, mealType, plans }: PlanCellProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mount the modal (and its selector queries) only after the first open;
  // 28 always-mounted modals made the page suspend on their set-menu query
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | undefined>();

  const handleOpenNew = () => {
    setSelectedPlan(undefined);
    setHasOpenedModal(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setHasOpenedModal(true);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex h-full min-h-[68px] min-w-0 flex-col gap-1 overflow-hidden p-1.5">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="block w-full truncate rounded-md bg-primary/8 px-1.5 py-2 text-left text-[11px] font-medium leading-tight text-foreground transition-colors hover:bg-primary/15"
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
            onClose={() => setIsModalOpen(false)}
            date={date}
            mealType={mealType}
            existingPlan={selectedPlan}
          />
        </Suspense>
      )}
    </>
  );
};

export { PlanCell };
