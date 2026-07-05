"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

/** Wraps the app with Jotai and TanStack Query providers */
const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Keep cached data long enough to survive tab switches; stale data
            // is shown instantly and revalidated in the background
            gcTime: 30 * 60 * 1000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <JotaiProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </JotaiProvider>
    </ThemeProvider>
  );
};

export { Providers };
