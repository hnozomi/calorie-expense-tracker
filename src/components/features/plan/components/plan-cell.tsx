"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { MealType } from "@/types";
import { cn } from "@/utils";
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
      <div className="flex h-full min-h-[68px] flex-col gap-1 p-1.5">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className={cn(
              "truncate rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition-colors",
              plan.isTransferred
                ? "bg-muted/40 text-muted-foreground line-through hover:bg-muted/60"
                : "bg-primary/8 font-medium text-foreground hover:bg-primary/15",
            )}
            onClick={() => handleOpenEdit(plan)}
          >
            {plan.plannedName}
          </button>
        ))}
        <button
          type="button"
          className="mt-auto flex items-center justify-center rounded-md border border-dashed border-border/50 py-1 text-muted-foreground/60 transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          onClick={handleOpenNew}
        >
          <Plus className="h-3.5 w-3.5" />
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
