"use client";

import { useCallback, useState } from "react";
import type { PendingFormItem } from "@/components/features/meals/types/meal";

type Params = {
  hasDrafts: boolean;
  collectPendingFormItems: () => PendingFormItem[];
  closeDrawer: () => void;
  setIsOpen: (open: boolean) => void;
};

/** Asks before the drawer closes when drafts or typed-but-unadded input would be lost */
export const useDrawerCloseConfirm = ({
  hasDrafts,
  collectPendingFormItems,
  closeDrawer,
  setIsOpen,
}: Params) => {
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setIsOpen(true);
        return;
      }
      if (hasDrafts || collectPendingFormItems().length > 0) {
        setIsDiscardConfirmOpen(true);
        return;
      }
      closeDrawer();
    },
    [hasDrafts, closeDrawer, collectPendingFormItems, setIsOpen],
  );

  const handleDiscardDrafts = useCallback(() => {
    setIsDiscardConfirmOpen(false);
    closeDrawer();
  }, [closeDrawer]);

  return {
    isDiscardConfirmOpen,
    setIsDiscardConfirmOpen,
    handleOpenChange,
    handleDiscardDrafts,
  };
};
