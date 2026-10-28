import { Tag } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SetMenuFormValues } from "@/components/features/set-menus/types/set-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";

type Props = {
  register: UseFormRegister<SetMenuFormValues>;
  errors: FieldErrors<SetMenuFormValues>;
};

export const SetMenuBasicSection = ({ register, errors }: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Tag} label="基本情報" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <div className="space-y-1.5">
        <Label htmlFor="sm-name" className="text-xs">
          セットメニュー名 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="sm-name"
          placeholder="例: 朝定食セット"
          enterKeyHint="done"
          autoComplete="off"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "sm-name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="sm-name-error" className="text-xs text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>
    </div>
  </section>
);
