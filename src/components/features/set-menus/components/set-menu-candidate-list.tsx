import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type Candidate = {
  id: string;
  name: string;
};

type Props<T extends Candidate> = {
  candidates: T[];
  search: string;
  placeholder: string;
  emptyMessage: string;
  searchEmptyMessage: string;
  /** Recipes show one person's share */
  caloriesLabelOf: (candidate: T) => string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAdd: (candidate: T) => void;
};

export const SetMenuCandidateList = <T extends Candidate>({
  candidates,
  search,
  placeholder,
  emptyMessage,
  searchEmptyMessage,
  caloriesLabelOf,
  onSearchChange,
  onAdd,
}: Props<T>) => (
  <div className="space-y-2">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder}
        aria-label={placeholder}
        value={search}
        onChange={onSearchChange}
        className="pl-9"
      />
    </div>
    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg">
      {candidates.length > 0 ? (
        candidates.map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            onClick={() => onAdd(candidate)}
          >
            <span className="truncate font-medium">{candidate.name}</span>
            <span className="ml-2 whitespace-nowrap text-xs text-muted-foreground">
              {caloriesLabelOf(candidate)}
            </span>
          </button>
        ))
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {search ? searchEmptyMessage : emptyMessage}
        </p>
      )}
    </div>
  </div>
);
