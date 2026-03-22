"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SourceType } from "@/types";
import { useDeleteMealItem } from "../hooks/use-delete-meal-item";
import { useUpdateMealItem } from "../hooks/use-update-meal-item";
import {
  type MealItem,
  type MealItemFormValues,
  mealItemFormSchema,
} from "../types/meal";
import { NutritionFormFields } from "./nutrition-form-fields";

type MealItemEditModalProps = {
  item: MealItem | null;
  date: string;
  isOpen: boolean;
  onClose: () => void;
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  manual: "手動",
  ocr: "OCR",
  recipe: "レシピ",
  food_master: "食品マスタ",
  set_menu: "セット",
};

/** Modal for editing or deleting an existing meal item */
const MealItemEditModal = ({
  item,
  date,
  isOpen,
  onClose,
}: MealItemEditModalProps) => {
  const updateMutation = useUpdateMealItem();
  const deleteMutation = useDeleteMealItem();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MealItemFormValues>({
    resolver: zodResolver(mealItemFormSchema) as Resolver<MealItemFormValues>,
    values: item
      ? {
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs,
          cost: item.cost ?? undefined,
        }
      : undefined,
  });

  const handleSave = async (values: MealItemFormValues) => {
    if (!item) return;
    try {
      await updateMutation.mutateAsync({ itemId: item.id, date, values });
      toast.success("変更を保存しました");
      onClose();
    } catch {
      toast.error("更新に失敗しました");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    try {
      await deleteMutation.mutateAsync({ itemId: item.id, date });
      toast.success("削除しました");
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-3.5 w-3.5 text-primary" />
            </div>
            アイテム編集
            <Badge variant="secondary" className="ml-auto text-xs">
              {SOURCE_TYPE_LABELS[item.sourceType]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            食事アイテムの内容を編集できます
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
          <NutritionFormFields
            register={register}
            errors={errors}
            idPrefix="edit"
          />

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "保存中..." : "変更を保存"}
            </Button>
          </div>

          <button
            type="button"
            className="w-full text-center text-sm text-destructive transition-colors hover:text-destructive/80 hover:underline"
            onClick={() => setIsDeleteConfirmOpen(true)}
          >
            このアイテムを削除する
          </button>
        </form>

        {isDeleteConfirmOpen && (
          <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium">
              「{item.name}」を削除しますか？
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "削除中..." : "削除する"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export { MealItemEditModal };
