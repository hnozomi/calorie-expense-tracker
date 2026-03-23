"use client";

import {
  ArrowLeft,
  Flame,
  Notebook,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PfcDot } from "@/components/ui/pfc-display";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useRecipeFormController } from "../hooks/use-recipe-form-controller";
import { RecipeIngredientsEditor } from "./recipe-ingredients-editor";

type RecipeFormViewProps = {
  id: string;
};

/** Form view for creating or editing a recipe with ingredients */
const RecipeFormView = ({ id }: RecipeFormViewProps) => {
  const router = useRouter();
  const {
    form: {
      register,
      formState: { errors },
    },
    existing,
    ingredients,
    isDeleteConfirmOpen,
    isLoading,
    isNew,
    totalIngredientCost,
    deleteMutation,
    saveMutation,
    setIsDeleteConfirmOpen,
    handleAddIngredient,
    handleDelete,
    handleIngredientChange,
    handleRemoveIngredient,
    handleSave,
  } = useRecipeFormController({ id });

  if (!isNew && isLoading) {
    return (
      <>
        <Header title="レシピ">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push("/recipes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Header>
        <PageContainer>
          <div className="space-y-5 p-4">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-1/2 rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={isNew ? "レシピを登録" : "レシピを編集"}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/recipes")}
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
                <Label htmlFor="recipe-name" className="text-xs">
                  レシピ名 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="recipe-name"
                  placeholder="例: 鶏むね肉のサラダ"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">
                    {errors.name.message}
                  </p>
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
                  <p className="text-xs text-destructive">
                    {errors.servings.message}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ── 栄養成分セクション ── */}
          <section className="space-y-3">
            <SectionHeader icon={Flame} label="栄養成分（合計）">
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                食費合計: ¥{Math.round(totalIngredientCost)}
              </span>
            </SectionHeader>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              {/* Calories */}
              <div className="space-y-1.5">
                <Label htmlFor="recipe-calories" className="text-xs">
                  <Sparkles className="mr-1 inline-block h-3 w-3 text-amber-500" />
                  カロリー (kcal)
                </Label>
                <Input
                  id="recipe-calories"
                  type="number"
                  inputMode="decimal"
                  step="any"
                  className="text-lg font-semibold tracking-wide"
                  placeholder="0"
                  {...register("calories")}
                />
              </div>

              {/* PFC color-coded cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="space-y-1.5 rounded-lg border border-blue-200/60 bg-blue-50/50 p-2.5 dark:border-blue-900/40 dark:bg-blue-950/20">
                  <Label
                    htmlFor="recipe-protein"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-blue-500" />
                    <span className="text-blue-700 dark:text-blue-400">
                      P (g)
                    </span>
                  </Label>
                  <Input
                    id="recipe-protein"
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
                    htmlFor="recipe-fat"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-amber-500" />
                    <span className="text-amber-700 dark:text-amber-400">
                      F (g)
                    </span>
                  </Label>
                  <Input
                    id="recipe-fat"
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
                    htmlFor="recipe-carbs"
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <PfcDot color="bg-green-500" />
                    <span className="text-green-700 dark:text-green-400">
                      C (g)
                    </span>
                  </Label>
                  <Input
                    id="recipe-carbs"
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

          {/* ── 材料セクション ── */}
          <RecipeIngredientsEditor
            ingredients={ingredients}
            onAdd={handleAddIngredient}
            onChange={handleIngredientChange}
            onRemove={handleRemoveIngredient}
          />

          {/* ── メモセクション ── */}
          <section className="space-y-3">
            <SectionHeader icon={Notebook} label="メモ" />
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <Textarea
                id="recipe-notes"
                placeholder="調理手順や備考..."
                rows={3}
                {...register("notes")}
              />
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
                  このレシピを削除する
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
    </>
  );
};

export { RecipeFormView };
