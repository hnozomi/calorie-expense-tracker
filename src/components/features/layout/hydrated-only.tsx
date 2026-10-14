"use client";
// Client because it waits for hydration (logic lives in useHasHydrated)

import { useHasHydrated } from "@/hooks";

type Props = {
  fallback: React.ReactNode;
  children: React.ReactNode;
};

// The views below fetch with the browser's Supabase session. Rendered while the page is prerendered at build
// time they fetched without one, and the empty result (「この週の記録はありません」, the build's week) was
// baked into the HTML and shown before the real data
export const HydratedOnly = ({ fallback, children }: Props) => {
  return useHasHydrated() ? children : fallback;
};
