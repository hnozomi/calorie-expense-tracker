import { Notebook, ShoppingCart } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { FoodMasterFormInput } from "@/components/features/food-masters/types/food-master";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  register: UseFormRegister<FoodMasterFormInput>;
  errors: FieldErrors<FoodMasterFormInput>;
};

export const FoodMasterOtherSection = ({ register, errors }: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Notebook} label="その他" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="fm-price" className="flex items-center gap-1 text-xs">
          <ShoppingCart className="h-3 w-3 text-muted-foreground" />
          価格 (円)
        </Label>
        <Input
          id="fm-price"
          type="number"
          inputMode="decimal"
          placeholder="0"
          {...register("defaultPrice")}
        />
        {errors.defaultPrice && (
          <p className="text-xs text-destructive">
            {errors.defaultPrice.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fm-notes" className="text-xs">
          メモ
        </Label>
        <Textarea
          id="fm-notes"
          placeholder="任意のメモ..."
          rows={3}
          {...register("notes")}
        />
      </div>
    </div>
  </section>
);
