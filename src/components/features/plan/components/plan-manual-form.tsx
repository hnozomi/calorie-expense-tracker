import type { PlanManualValues } from "@/components/features/plan/types/meal-plan";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlanNumberField } from "./plan-number-field";

type Props = {
  values: PlanManualValues;
  onChange: (key: keyof PlanManualValues, value: string) => void;
  onSave: () => void;
};

export const PlanManualForm = ({ values, onChange, onSave }: Props) => {
  const field = (key: keyof PlanManualValues) => ({
    value: values[key],
    onChange: (value: string) => onChange(key, value),
  });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="plan-manual-name" className="text-xs font-medium">
          メニュー名
        </Label>
        <Input
          id="plan-manual-name"
          placeholder="例: ご飯と味噌汁"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <PlanNumberField
          id="plan-manual-calories"
          label="カロリー (kcal)"
          field={field("calories")}
        />
        <PlanNumberField
          id="plan-manual-cost"
          label="食費 (円)"
          field={field("cost")}
          allowFraction={false}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <PlanNumberField
          id="plan-manual-protein"
          label="P (g)"
          field={field("protein")}
        />
        <PlanNumberField
          id="plan-manual-fat"
          label="F (g)"
          field={field("fat")}
        />
        <PlanNumberField
          id="plan-manual-carbs"
          label="C (g)"
          field={field("carbs")}
        />
      </div>
      <Button className="w-full" onClick={onSave}>
        保存
      </Button>
    </div>
  );
};
