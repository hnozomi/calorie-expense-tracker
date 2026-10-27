"use client";

import { useLayoutEffect, useState } from "react";

export const useShoppingListButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Closed when the plan screen is hidden by moving to another tab, like the cell dialogs
  useLayoutEffect(() => () => setIsOpen(false), []);
  return { isOpen, open: () => setIsOpen(true), setIsOpen };
};
