"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

type Identifiable = { id: string };

type ListCacheSeed<T> = {
  data: T;
  updatedAt: number;
};

/** Find a record in cached list queries so its detail page renders instantly,
 *  without waiting for the detail fetch. Pass a stable key prefix. */
export const useListCacheSeed = <T extends Identifiable>(
  listKeyPrefix: readonly unknown[],
  id: string | undefined,
): ListCacheSeed<T> | undefined => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!id) return undefined;
    const listQueries = queryClient
      .getQueryCache()
      .findAll({ queryKey: listKeyPrefix as unknown[] });
    for (const listQuery of listQueries) {
      const rows = listQuery.state.data;
      if (!Array.isArray(rows)) continue;
      const hit = (rows as T[]).find((row) => row.id === id);
      if (hit) return { data: hit, updatedAt: listQuery.state.dataUpdatedAt };
    }
    return undefined;
  }, [queryClient, listKeyPrefix, id]);
};
