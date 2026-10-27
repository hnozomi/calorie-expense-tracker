"use client";
// Client because typing updates the URL

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useUrlSearch } from "./use-url-search";

type Props = {
  basePath: string;
  initialQuery: string;
  placeholder: string;
};

/** A sticky search field whose words live in ?q=, so reloading or sharing the URL keeps the search */
export const SearchBox = ({ basePath, initialQuery, placeholder }: Props) => {
  const { query, handleChange } = useUrlSearch(basePath, initialQuery);
  return (
    <div className="sticky top-14 z-30 bg-background/80 px-4 pb-3 pt-3 backdrop-blur-sm">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          enterKeyHint="search"
          aria-label={placeholder}
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          className="rounded-full border-muted-foreground/20 bg-muted/50 pl-10 shadow-sm transition-shadow focus:shadow-md"
        />
      </div>
    </div>
  );
};
