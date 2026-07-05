"use client";

import { useCallback, useState } from "react";

/** Guard an exit action behind a confirmation dialog when there are unsaved changes */
export const useUnsavedChangesGuard = (
  hasUnsavedChanges: boolean,
  onExit: () => void,
) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  /** Exit immediately when clean; otherwise ask for confirmation first */
  const requestExit = useCallback(() => {
    if (hasUnsavedChanges) {
      setIsConfirmOpen(true);
      return;
    }
    onExit();
  }, [hasUnsavedChanges, onExit]);

  /** Discard changes and exit */
  const confirmExit = useCallback(() => {
    setIsConfirmOpen(false);
    onExit();
  }, [onExit]);

  return { isConfirmOpen, setIsConfirmOpen, requestExit, confirmExit };
};
