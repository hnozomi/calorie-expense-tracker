type Candidate = {
  id: string;
  name: string;
};

type Props<T extends Candidate> = {
  candidates: T[];
  /** Recipes show one person's share, set menus their total */
  caloriesOf: (candidate: T) => number;
  emptyMessage: string;
  onSelect: (candidate: T) => void;
};

export const PlanCandidateList = <T extends Candidate>({
  candidates,
  caloriesOf,
  emptyMessage,
  onSelect,
}: Props<T>) => (
  <div className="max-h-52 divide-y divide-border/40 overflow-y-auto rounded-lg border border-border/60">
    {candidates.length > 0 ? (
      candidates.map((candidate) => (
        <button
          key={candidate.id}
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
          onClick={() => onSelect(candidate)}
        >
          <span className="truncate font-medium">{candidate.name}</span>
          <span className="ml-2 whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {Math.round(caloriesOf(candidate))} kcal
          </span>
        </button>
      ))
    ) : (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    )}
  </div>
);
