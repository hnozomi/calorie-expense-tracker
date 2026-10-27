"use client";

import { useLayoutEffect, useState } from "react";
import type { MealPlan } from "@/components/features/plan/types/meal-plan";

/** Which plan the cell's dialog edits (none for a new one), and whether it is open */
export const usePlanCell = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Mount the dialog only after the first open: it unwraps the candidates with use(), and 28 always-mounted
  // dialogs made the whole grid wait for them
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<MealPlan | undefined>();

  // The plan screen stays mounted (hidden) after moving to another tab; close the dialog so it is not open on return
  useLayoutEffect(() => () => setIsModalOpen(false), []);

  const openFor = (plan: MealPlan | undefined) => {
    setSelectedPlan(plan);
    setHasOpenedModal(true);
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    hasOpenedModal,
    selectedPlan,
    handleOpenNew: () => openFor(undefined),
    handleOpenEdit: (plan: MealPlan) => openFor(plan),
    closeModal: () => setIsModalOpen(false),
    reopenModal: () => setIsModalOpen(true),
  };
};
