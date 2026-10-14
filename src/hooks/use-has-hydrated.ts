import { useEffect, useState } from "react";

// Module-level, so a tab opened again in the same page load does not show the placeholder twice
let hasHydratedOnce = false;

export const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState(hasHydratedOnce);
  useEffect(() => {
    hasHydratedOnce = true;
    setHasHydrated(true);
  }, []);
  return hasHydrated;
};
