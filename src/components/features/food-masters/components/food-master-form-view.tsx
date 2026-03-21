"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS } from "@/types";
import { useDeleteFoodMaster } from "../hooks/use-delete-food-master";
import { useFoodMasterDetail } from "../hooks/use-food-master-detail";
import { useSaveFoodMaster } from "../hooks/use-save-food-master";
import {
  type FoodMasterFormValues,
  foodMasterFormSchema,
} from "../types/food-master";

type FoodMasterFormViewProps = {
  id: string;
};

/** Form view for creating or editing a food master */
const FoodMasterFormView = ({ id }: FoodMasterFormViewProps) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useFoodMasterDetail(
    isNew ? undefined : id,
  );
  const saveMutation = useSaveFoodMaster();
  const deleteMutation = useDeleteFoodMaster();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FoodMasterFormValues>({
    resolver: zodResolver(
      foodMasterFormSchema,
    ) as Resolver<FoodMasterFormValues>,
    values: existing
      ? {
          name: existing.name,
          brand: existing.brand ?? undefined,
          category: existing.category ?? undefined,
          calories: existing.calories,
          protein: existing.protein,
          fat: existing.fat,
          carbs: existing.carbs,
          defaultPrice: existing.defaultPrice ?? undefined,
          notes: existing.notes ?? undefined,
        }
      : undefined,
  });

  const categoryValue = watch("category");

  const handleSave = async (values: FoodMasterFormValues) => {
    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        values,
      });
      toast.success(isNew ? "食品を登録しました" : "変更を保存しました");
      router.push("/other/food-masters");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("食品を削除しました");
      router.push("/other/food-masters");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  if (!isNew && isLoading) {
    return (
      <>
        <Header title="食品マスタ" />
        <PageContainer>
          <div className="p-4">読み込み中...</div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={isNew ? "食品を登録" : "食品を編集"}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/other/food-masters")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 p-4">
          <div className="space-y-1">
            <Label htmlFor="fm-name">食品名 *</Label>
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
            <div className="space-y-1">
              <Label htmlFor="fm-brand">ブランド</Label>
              <Input
                id="fm-brand"
                placeholder="例: セブンイレブン"
                {...register("brand")}
              />
            </div>
            <div className="space-y-1">
              <Label>カテゴリ</Label>
              <Select
                value={categoryValue ?? ""}
                onValueChange={(val) =>
                  setValue(
                    "category",
                    val as FoodMasterFormValues["category"],
                    {
                      shouldValidate: true,
                    },
                  )
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

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fm-calories">カロリー (kcal)</Label>
              <Input
                id="fm-calories"
                type="number"
                inputMode="decimal"
                {...register("calories")}
              />
              {errors.calories && (
                <p className="text-xs text-destructive">
                  {errors.calories.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="fm-price">価格 (円)</Label>
              <Input
                id="fm-price"
                type="number"
                inputMode="decimal"
                {...register("defaultPrice")}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fm-protein">P (g)</Label>
              <Input
                id="fm-protein"
                type="number"
                inputMode="decimal"
                {...register("protein")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fm-fat">F (g)</Label>
              <Input
                id="fm-fat"
                type="number"
                inputMode="decimal"
                {...register("fat")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fm-carbs">C (g)</Label>
              <Input
                id="fm-carbs"
                type="number"
                inputMode="decimal"
                {...register("carbs")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="fm-notes">メモ</Label>
            <Textarea
              id="fm-notes"
              placeholder="任意のメモ..."
              rows={3}
              {...register("notes")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending
              ? "保存中..."
              : isNew
                ? "登録する"
                : "変更を保存"}
          </Button>

          {!isNew && (
            <>
              <button
                type="button"
                className="w-full text-center text-sm text-destructive hover:underline"
                onClick={() => setIsDeleteConfirmOpen(true)}
              >
                この食品を削除する
              </button>

              {isDeleteConfirmOpen && (
                <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <p className="text-sm font-medium">
                    「{existing?.name}」を削除しますか？
                  </p>
                  <p className="text-xs text-muted-foreground">
                    過去の食事記録は影響を受けません。
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setIsDeleteConfirmOpen(false)}
                    >
                      キャンセル
                    </Button>
                    <Button
                      type="button"
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
            </>
          )}
        </form>
      </PageContainer>
    </>
  );
};

export { FoodMasterFormView };
