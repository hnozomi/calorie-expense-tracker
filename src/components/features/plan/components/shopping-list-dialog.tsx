"use client";
// Client because it is a dialog opened from the plan screen

import { ShoppingCart } from "lucide-react";
import { Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingListBody } from "./shopping-list-body";
import { ShoppingListSkeleton } from "./shopping-list-skeleton";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ShoppingListDialog = ({ isOpen, onOpenChange }: Props) => (
  <Dialog open={isOpen} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ShoppingCart className="h-4 w-4" />
          買い物リスト
        </DialogTitle>
        <DialogDescription>
          この週のレシピ由来の献立から材料を集計しています(手動入力の献立は含まれません)
        </DialogDescription>
      </DialogHeader>
      <Suspense fallback={<ShoppingListSkeleton />}>
        <ShoppingListBody />
      </Suspense>
    </DialogContent>
  </Dialog>
);
