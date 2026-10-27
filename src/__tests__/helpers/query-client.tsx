import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { queryKeys } from "@/hooks";

// Screens still reading through TanStack Query (plan, report) until phase 5
const LEGACY_SCREEN_KEYS = [
  queryKeys.plans.weekly("2026-10-19"),
  queryKeys.report.weekly("2026-10-19"),
] as const;

/** Render inside the TanStack Query client the root layout provides, with the legacy screens' data already read */
export const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  for (const key of LEGACY_SCREEN_KEYS) queryClient.setQueryData(key, []);
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { ...render(ui, { wrapper: Wrapper }), queryClient };
};

/** Whether every legacy screen's data is marked stale, so it is read again when shown */
export const areLegacyScreensStale = (queryClient: QueryClient) =>
  LEGACY_SCREEN_KEYS.every(
    (key) => queryClient.getQueryState(key)?.isInvalidated === true,
  );

/** Whether no legacy screen's data is marked stale */
export const areLegacyScreensFresh = (queryClient: QueryClient) =>
  LEGACY_SCREEN_KEYS.every(
    (key) => queryClient.getQueryState(key)?.isInvalidated === false,
  );
