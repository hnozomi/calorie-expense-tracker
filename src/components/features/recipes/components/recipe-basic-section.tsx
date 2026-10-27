import { Tag } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { RecipeFormInput } from "@/components/features/recipes/types/recipe";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";

type Props = {
  register: UseFormRegister<RecipeFormInput>;
  errors: FieldErrors<RecipeFormInput>;
};

export const RecipeBasicSection = ({ register, errors }: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Tag} label="基本情報" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="recipe-name" className="text-xs">
          レシピ名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recipe-name"
          placeholder="例: 鶏むね肉のサラダ"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recipe-servings" className="text-xs">
          何人分 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recipe-servings"
          type="number"
          inputMode="numeric"
          {...register("servings")}
        />
        {errors.servings && (
          <p className="text-xs text-destructive">{errors.servings.message}</p>
        )}
      </div>
    </div>
  </section>
);
