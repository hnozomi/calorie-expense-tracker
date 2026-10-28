import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  id: string;
  label: React.ReactNode;
  value: string;
  error?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export const TargetField = ({ id, label, value, error, onChange }: Props) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs font-medium">
      {label}
    </Label>
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      step="any"
      enterKeyHint="done"
      value={value}
      onChange={onChange}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
    />
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);
