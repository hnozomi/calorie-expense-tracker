"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks";

/** The search box's text, written to ?q= of basePath a moment after typing stops (replace: no history entry per key) */
export const useUrlSearch = (basePath: string, initialQuery: string) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query);
  const lastWrittenRef = useRef(initialQuery);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed === lastWrittenRef.current) return;
    lastWrittenRef.current = trimmed;
    router.replace(
      trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath,
    );
  }, [basePath, debouncedQuery, router]);

  return { query, setQuery };
};
