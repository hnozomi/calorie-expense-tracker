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
import { DeleteItemSection } from "./delete-item-section";
import { NutritionFormFields } from "./nutrition-form-fields";

type Props = {
  item: MealItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveFailed: (itemWithTypedValues: MealItem) => void;
};

/** Bottom drawer for editing or deleting an existing meal item */
export const MealItemEditModal = ({
  item,
  isOpen,
  onClose,
  onSaveFailed,
}: Props) => {
  const {
    form: {
      register,
      handleSubmit,
      formState: { errors },
    },
    isDeleteConfirmOpen,
    openDeleteConfirm,
    closeDeleteConfirm,
    handleOpenChange,
    handleSave,
    handleDelete,
  } = useMealItemEdit(item, onClose, onSaveFailed);

  if (!item) return null;

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
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

          <DeleteItemSection
            itemName={item.name}
            isConfirmOpen={isDeleteConfirmOpen}
            onAsk={openDeleteConfirm}
            onCancel={closeDeleteConfirm}
            onDelete={handleDelete}
          />
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
