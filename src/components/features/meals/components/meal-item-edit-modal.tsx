"use client";
// Client because it is a form in a drawer

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SOURCE_TYPE_LABELS } from "@/types";
import { useMealItemEdit } from "../hooks/use-meal-item-edit";
import type { MealItem } from "../types/meal";
import { NutritionFormFields } from "./nutrition-form-fields";

type MealItemEditModalProps = {
  item: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
};

/** Bottom drawer for editing or deleting an existing meal item */
const MealItemEditModal = ({
  item,
  isOpen,
  onClose,
}: MealItemEditModalProps) => {
  const {
    form: {
      register,
      handleSubmit,
      formState: { errors },
    },
    isDeleteConfirmOpen,
    setIsDeleteConfirmOpen,
    handleSave,
    handleDelete,
  } = useMealItemEdit(item, onClose);

  if (!item) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[80dvh]">
        <DrawerHeader className="flex-row items-center justify-between pb-2">
          <div>
            <DrawerTitle className="text-base">アイテム編集</DrawerTitle>
            <DrawerDescription className="sr-only">
              既存の食事アイテムの栄養情報を編集または削除します
            </DrawerDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            {SOURCE_TYPE_LABELS[item.sourceType]}
          </Badge>
        </DrawerHeader>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <form
            id="edit-meal-form"
            onSubmit={handleSubmit(handleSave)}
            className="space-y-3"
          >
            <NutritionFormFields
              register={register}
              errors={errors}
              idPrefix="edit"
            />
          </form>

          {/* Delete section */}
          {isDeleteConfirmOpen ? (
            <div className="mt-4 space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
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
                  onClick={handleDelete}
                >
                  削除する
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="mt-4 w-full text-center text-sm text-destructive transition-colors hover:text-destructive/80 hover:underline"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              このアイテムを削除する
            </button>
          )}
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t bg-background px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <Button type="submit" form="edit-meal-form" className="w-full">
            変更を保存
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export { MealItemEditModal };
