import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { queryKeys } from "@/hooks";

// No screen reads through TanStack Query any more, but the provider and useRefreshLegacyScreens stay until phase 6,
// so a save still marks every cached query stale. Two seeded keys stand in for that cache
const LEGACY_SCREEN_KEYS = [
  queryKeys.plans.weekly("2026-10-19"),
  queryKeys.report.weekly("2026-10-19"),
] as const;

/** Render inside the TanStack Query client the root layout provides, with the seeded keys already read */
export const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  for (const key of LEGACY_SCREEN_KEYS) queryClient.setQueryData(key, []);
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...render(ui, { wrapper: Wrapper }), queryClient };
};

/** Whether every seeded query is marked stale (useRefreshLegacyScreens ran) */
export const areLegacyScreensStale = (queryClient: QueryClient) =>
  LEGACY_SCREEN_KEYS.every(
    (key) => queryClient.getQueryState(key)?.isInvalidated === true,
  );

/** Whether no seeded query is marked stale (useRefreshLegacyScreens did not run) */
export const areLegacyScreensFresh = (queryClient: QueryClient) =>
  LEGACY_SCREEN_KEYS.every(
    (key) => queryClient.getQueryState(key)?.isInvalidated === false,
  );
