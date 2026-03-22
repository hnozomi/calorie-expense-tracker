"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin progress bar at the top of the page during route transitions.
 * Shows on nav:start (fired by BottomNavigation), hides when pathname changes.
 */
const NavigationProgress = () => {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  /** Listen for nav:start custom event */
  useEffect(() => {
    const show = () => setVisible(true);
    window.addEventListener("nav:start", show);
    return () => window.removeEventListener("nav:start", show);
  }, []);

  /** Hide progress bar when pathname actually changes */
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setVisible(false);
    }
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5">
      <div className="h-full w-full animate-progress bg-brand" />
    </div>
  );
};

export { NavigationProgress };
