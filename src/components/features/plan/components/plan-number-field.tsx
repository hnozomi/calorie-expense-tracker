import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type Field = {
  value: string;
  onChange: (value: string) => void;
};

type Props = {
  id: string;
  label: string;
  field: Field;
  allowFraction?: boolean;
};

export const PlanNumberField = ({
  id,
  label,
  field,
  allowFraction = true,
}: Props) => (
  <div className="space-y-1.5">
    <Label htmlFor={id} className="text-xs font-medium">
      {label}
    </Label>
    <Input
      id={id}
      type="number"
      inputMode="decimal"
      step={allowFraction ? "any" : undefined}
      placeholder="0"
      value={field.value}
      onChange={(e) => field.onChange(e.target.value)}
    />
  </div>
);
