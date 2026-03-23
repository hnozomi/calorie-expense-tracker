"use client";

import {
  ArrowLeft,
  Camera,
  Flame,
  Notebook,
  ScanLine,
  ShoppingCart,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Header, PageContainer } from "@/components/features/layout";
import { OcrCameraOverlay } from "@/components/features/ocr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PfcDot } from "@/components/ui/pfc-display";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS } from "@/types";
import { useFoodMasterFormController } from "../hooks/use-food-master-form-controller";
import type { FoodMasterFormValues } from "../types/food-master";

type FoodMasterFormViewProps = {
  id: string;
};

/** Form view for creating or editing a food master */
const FoodMasterFormView = ({ id }: FoodMasterFormViewProps) => {
  const router = useRouter();
  const {
    form: {
      register,
      watch,
      setValue,
      formState: { errors },
    },
    existing,
    isDeleteConfirmOpen,
    isLoading,
    isNew,
    isOcrOpen,
    deleteMutation,
    saveMutation,
    setIsDeleteConfirmOpen,
    setIsOcrOpen,
    handleDelete,
    handleOcrResult,
    handleSave,
  } = useFoodMasterFormController(id);

  const categoryValue = watch("category");

  if (!isNew && isLoading) {
    return (
      <>
        <Header title="食品マスタ">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/other/food-masters")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Header>
        <PageContainer>
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
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
        <form onSubmit={handleSave} className="space-y-5 p-4">
          {/* ── 基本情報セクション ── */}
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
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
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
            </div>
          </section>

          {/* ── OCR読み取りボタン ── */}
          <button
            type="button"
            className="group flex w-full items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.03] px-4 py-3 transition-all hover:border-primary/50 hover:bg-primary/[0.06] active:scale-[0.98]"
            onClick={() => setIsOcrOpen(true)}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
              <ScanLine className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                栄養成分表示をカメラで読み取り
              </p>
              <p className="text-xs text-muted-foreground">
                ラベルを撮影して自動入力
              </p>
            </div>
            <Camera className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </button>

          {/* ── 栄養成分セクション ── */}
          <section className="space-y-3">
            <SectionHeader icon={Flame} label="栄養成分" />
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              {/* カロリー — 大きく目立たせる */}
              <div className="space-y-1.5">
                <Label htmlFor="fm-calories" className="text-xs">
                  <Sparkles className="mr-1 inline-block h-3 w-3 text-amber-500" />
                  カロリー (kcal)
                </Label>
                <Input
                  id="fm-calories"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className="text-lg font-semibold tracking-wide"
                  placeholder="0"
                  {...register("calories")}
                />
                {errors.calories && (
                  <p className="text-xs text-destructive">
                    {errors.calories.message}
                  </p>
                )}
              </div>

              {/* PFC — 色分けされた3カラム */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5 rounded-lg border border-blue-200/60 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Label
                    htmlFor="fm-protein"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-blue-500" />
                    <span className="text-blue-700 dark:text-blue-400">
                      P (g)
                    </span>
                  </Label>
                  <Input
                    id="fm-protein"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="border-blue-200/80 bg-white font-medium text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300"
                    placeholder="0"
                    {...register("protein")}
                  />
                </div>
                <div className="space-y-1.5 rounded-lg border border-amber-200/60 bg-amber-50/50 p-2.5 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <Label
                    htmlFor="fm-fat"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">
                      F (g)
                    </span>
                  </Label>
                  <Input
                    id="fm-fat"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="border-amber-200/80 bg-white font-medium text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
                    placeholder="0"
                    {...register("fat")}
                  />
                </div>
                <div className="space-y-1.5 rounded-lg border border-green-200/60 bg-green-50/50 p-2.5 dark:border-green-900/40 dark:bg-green-950/20">
                  <Label
                    htmlFor="fm-carbs"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-green-500" />
                    <span className="text-green-700 dark:text-green-400">
                      C (g)
                    </span>
                  </Label>
                  <Input
                    id="fm-carbs"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className="border-green-200/80 bg-white font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300"
                    placeholder="0"
                    {...register("carbs")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── その他セクション ── */}
          <section className="space-y-3">
            <SectionHeader icon={Notebook} label="その他" />
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <div className="space-y-1.5">
                <Label
                  htmlFor="fm-price"
                  className="flex items-center gap-1 text-xs"
                >
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

          {/* ── 保存ボタン ── */}
          <Button
            type="submit"
            className="w-full py-3 text-base font-semibold shadow-sm"
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                保存中...
              </span>
            ) : isNew ? (
              <span className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                登録する
              </span>
            ) : (
              "変更を保存"
            )}
          </Button>

          {/* ── 削除ゾーン ── */}
          {!isNew && (
            <div className="pt-2">
              {!isDeleteConfirmOpen ? (
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-1.5 py-2 text-sm text-muted-foreground transition-colors hover:text-destructive"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  この食品を削除する
                </button>
              ) : (
                <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        「{existing?.name}」を削除しますか？
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        過去の食事記録は影響を受けません。
                      </p>
                    </div>
                  </div>
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
            </div>
          )}
        </form>
      </PageContainer>

      <OcrCameraOverlay
        isOpen={isOcrOpen}
        onClose={() => setIsOcrOpen(false)}
        onResult={handleOcrResult}
      />
    </>
  );
};

export { FoodMasterFormView };
