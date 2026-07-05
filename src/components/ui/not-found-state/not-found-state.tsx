import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type NotFoundStateProps = {
  message: string;
  backLabel: string;
  onBack: () => void;
};

/** Empty state shown when a requested record does not exist or was deleted */
const NotFoundState = ({ message, backLabel, onBack }: NotFoundStateProps) => {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" onClick={onBack}>
        {backLabel}
      </Button>
    </div>
  );
};

export { NotFoundState };
