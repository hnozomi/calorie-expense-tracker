import { QueryClient } from "@tanstack/react-query";

/** Create a new QueryClient for server-side prefetching */
export const getQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });
