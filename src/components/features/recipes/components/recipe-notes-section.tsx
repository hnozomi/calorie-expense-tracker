import { Notebook } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import type { RecipeFormInput } from "@/components/features/recipes/types/recipe";
import { SectionHeader } from "@/components/ui/section-header";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  register: UseFormRegister<RecipeFormInput>;
};

export const RecipeNotesSection = ({ register }: Props) => (
  <section className="space-y-3">
    <SectionHeader icon={Notebook} label="メモ" />
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
      <Textarea
        id="recipe-notes"
        aria-label="メモ"
        placeholder="調理手順や備考..."
        rows={3}
        {...register("notes")}
      />
    </div>
  </section>
);
