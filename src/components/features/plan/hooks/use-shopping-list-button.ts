"use client";

import { useState } from "react";
import { useIsShown } from "@/hooks";

export const useShoppingListButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Closed when the plan screen is hidden by moving to another tab, like the cell dialogs
  useIsShown(() => setIsOpen(false));
  return { isOpen, open: () => setIsOpen(true), setIsOpen };
};
