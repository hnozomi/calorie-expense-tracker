"use client";
// Client because it reads the current path with usePathname

import { usePathname } from "next/navigation";
import { BottomNavigationView } from "./bottom-navigation-view";

/** Bottom navigation that highlights the tab of the current path */
const BottomNavigation = () => {
  const pathname = usePathname();
  return <BottomNavigationView pathname={pathname} />;
};

export { BottomNavigation };
