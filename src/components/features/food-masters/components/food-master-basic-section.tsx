import { Tag } from "lucide-react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import type { FoodMasterFormInput } from "@/components/features/food-masters/types/food-master";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS } from "@/types";
import type { FoodMasterFormValues } from "../types/food-master";

type Props = {
  register: UseFormRegister<FoodMasterFormInput>;
  errors: FieldErrors<FoodMasterFormInput>;
  categoryValue: FoodMasterFormInput["category"];
  setValue: UseFormSetValue<FoodMasterFormInput>;
};

export const FoodMasterBasicSection = ({
  register,
  errors,
  categoryValue,
  setValue,
}: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Tag} label="基本情報" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="fm-name" className="text-xs">
          食品名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="fm-name"
          placeholder="例: サラダチキン（セブン）"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fm-brand" className="text-xs">
            ブランド
          </Label>
          <Input
            id="fm-brand"
            placeholder="例: セブンイレブン"
            {...register("brand")}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">カテゴリ</Label>
          <Select
            value={categoryValue ?? ""}
            onValueChange={(val) =>
              setValue("category", val as FoodMasterFormValues["category"], {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="選択..." />
            </SelectTrigger>
            <SelectContent>
              {FOOD_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {FOOD_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  </section>
);
