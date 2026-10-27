"use client";
// Client because it rewrites the URL as the user types

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks";

/** The search box's text, written to ?q= of basePath a moment after typing stops (replace: no history entry per key) */
export const useUrlSearch = (basePath: string, initialQuery: string) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [shownQuery, setShownQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query);

  // The URL can change without typing (browser back/forward, a link to /recipes). Take it over during render,
  // not in an effect, so the write-back effect below never sees the old text together with the new URL
  if (initialQuery !== shownQuery) {
    setShownQuery(initialQuery);
    if (initialQuery !== query.trim()) setQuery(initialQuery);
  }

  useEffect(() => {
    // Only once the debounce has caught up with what is in the field
    if (debouncedQuery !== query) return;
    const trimmed = query.trim();
    // The URL already says this (also true right after a write, until the next keystroke)
    if (trimmed === initialQuery) return;
    router.replace(
      trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath,
    );
  }, [basePath, debouncedQuery, initialQuery, query, router]);

  return {
    query,
    handleChange: (event: React.ChangeEvent<HTMLInputElement>) =>
      setQuery(event.target.value),
  };
};
