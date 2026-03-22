"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
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
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | undefined>();

  const handleOpenNew = () => {
    setSelectedPlan(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: MealPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex h-full min-h-[60px] flex-col gap-0.5 p-1">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="truncate rounded px-1 py-0.5 text-left text-xs hover:bg-muted"
            onClick={() => handleOpenEdit(plan)}
          >
            <span
              className={
                plan.isTransferred ? "text-muted-foreground line-through" : ""
              }
            >
              {plan.plannedName}
            </span>
          </button>
        ))}
        <button
          type="button"
          className="flex items-center justify-center rounded py-0.5 text-muted-foreground hover:bg-muted"
          onClick={handleOpenNew}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      <PlanMenuSelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        date={date}
        mealType={mealType}
        existingPlan={selectedPlan}
      />
    </>
  );
};

export { PlanCell };
