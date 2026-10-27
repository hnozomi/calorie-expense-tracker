"use client";
// Client because it opens the shopping list dialog

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShoppingListButton } from "../hooks/use-shopping-list-button";
import { ShoppingListDialog } from "./shopping-list-dialog";

export const ShoppingListButton = () => {
  const { isOpen, open, setIsOpen } = useShoppingListButton();
  return (
    <>
      <div className="flex justify-end px-4 pt-3">
        <Button
          variant="outline"
          size="sm"
          className="h-8 rounded-full px-3 text-xs"
          onClick={open}
        >
          <ShoppingCart className="mr-1 h-3.5 w-3.5" />
          買い物リスト
        </Button>
      </div>
      {/* Mounted only while open, so ticked items reset each time, as before */}
      {isOpen && <ShoppingListDialog isOpen onOpenChange={setIsOpen} />}
    </>
  );
};
