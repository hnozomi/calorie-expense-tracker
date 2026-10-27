"use client";

import { useState } from "react";

export const useShoppingListButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), setIsOpen };
};
