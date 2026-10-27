"use client";

import { useLayoutEffect, useRef } from "react";

// With cacheComponents a screen stays mounted (hidden) after moving to another tab. A save that fails after
// the move must not reopen a dialog there, or it is unexpectedly open on return; this tells whether the
// screen is shown right now. onHide runs as the screen is hidden (to close what was open)
export const useIsShown = (onHide?: () => void) => {
  const isShownRef = useRef(true);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;
  useLayoutEffect(() => {
    isShownRef.current = true;
    return () => {
      isShownRef.current = false;
      onHideRef.current?.();
    };
  }, []);
  return () => isShownRef.current;
};
