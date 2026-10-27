import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type Field, PlanNumberField } from "./plan-number-field";

type Props = {
  name: Field;
  calories: Field;
  cost: Field;
  protein: Field;
  fat: Field;
  carbs: Field;
  onSave: () => void;
};

export const PlanManualForm = ({
  name,
  calories,
  cost,
  protein,
  fat,
  carbs,
  onSave,
}: Props) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <Label htmlFor="plan-manual-name" className="text-xs font-medium">
        メニュー名
      </Label>
      <Input
        id="plan-manual-name"
        placeholder="例: ご飯と味噌汁"
        value={name.value}
        onChange={(e) => name.onChange(e.target.value)}
      />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <PlanNumberField
        id="plan-manual-calories"
        label="カロリー (kcal)"
        field={calories}
      />
      <PlanNumberField
        id="plan-manual-cost"
        label="食費 (円)"
        field={cost}
        allowFraction={false}
      />
    </div>
    <div className="grid grid-cols-3 gap-3">
      <PlanNumberField id="plan-manual-protein" label="P (g)" field={protein} />
      <PlanNumberField id="plan-manual-fat" label="F (g)" field={fat} />
      <PlanNumberField id="plan-manual-carbs" label="C (g)" field={carbs} />
    </div>
    <Button className="w-full" onClick={onSave}>
      保存
    </Button>
  </div>
);
