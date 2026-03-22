"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Flame,
  Notebook,
  Plus,
  ShoppingBasket,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PfcDot } from "@/components/ui/pfc-display";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDeleteRecipe } from "../hooks/use-delete-recipe";
import { useRecipeDetail } from "../hooks/use-recipe-detail";
import { useSaveRecipe } from "../hooks/use-save-recipe";
import type {
  IngredientFormValues,
  RecipeFormValues,
  RecipeIngredient,
} from "../types/recipe";
import { recipeFormSchema } from "../types/recipe";

type RecipeFormViewProps = {
  id: string;
};

/** Form view for creating or editing a recipe with ingredients */
const RecipeFormView = ({ id }: RecipeFormViewProps) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useRecipeDetail(isNew ? undefined : id);
  const saveMutation = useSaveRecipe();
  const deleteMutation = useDeleteRecipe();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  /** Local ingredients state managed separately from react-hook-form */
  const [ingredients, setIngredients] = useState<
    (IngredientFormValues & { tempId: string })[]
  >(() => {
    if (existing?.ingredients) {
      return existing.ingredients.map((ing: RecipeIngredient) => ({
        tempId: crypto.randomUUID(),
        id: ing.id,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unit: ing.unit,
        unitPrice: ing.unitPrice,
      }));
    }
    return [];
  });

  /** Sync ingredients from existing data when loaded */
  const [hasInitialized, setHasInitialized] = useState(false);
  if (existing && !hasInitialized && !isNew) {
    setIngredients(
      existing.ingredients.map((ing: RecipeIngredient) => ({
        tempId: crypto.randomUUID(),
        id: ing.id,
        ingredientName: ing.ingredientName,
        quantity: ing.quantity,
        unit: ing.unit,
        unitPrice: ing.unitPrice,
      })),
    );
    setHasInitialized(true);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema) as Resolver<RecipeFormValues>,
    values: existing
      ? {
          name: existing.name,
          servings: existing.servings,
          calories: existing.calories,
          protein: existing.protein,
          fat: existing.fat,
          carbs: existing.carbs,
          notes: existing.notes ?? undefined,
        }
      : {
          name: "",
          servings: 1,
          calories: 0,
          protein: 0,
          fat: 0,
          carbs: 0,
        },
  });

  /** Add a blank ingredient row */
  const handleAddIngredient = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        ingredientName: "",
        quantity: 1,
        unit: "",
        unitPrice: 0,
      },
    ]);
  }, []);

  /** Remove an ingredient by tempId */
  const handleRemoveIngredient = useCallback((tempId: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.tempId !== tempId));
  }, []);

  /** Update an ingredient field */
  const handleIngredientChange = useCallback(
    (tempId: string, field: keyof IngredientFormValues, value: string) => {
      setIngredients((prev) =>
        prev.map((ing) => {
          if (ing.tempId !== tempId) return ing;
          if (field === "ingredientName" || field === "unit") {
            return { ...ing, [field]: value };
          }
          return { ...ing, [field]: Number(value) || 0 };
        }),
      );
    },
    [],
  );

  /** Calculate total ingredient cost */
  const totalIngredientCost = ingredients.reduce(
    (sum, ing) => sum + ing.unitPrice * ing.quantity,
    0,
  );

  const handleSave = async (values: RecipeFormValues) => {
    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        values,
        ingredients: ingredients.filter((ing) => ing.ingredientName.trim()),
      });
      toast.success(isNew ? "レシピを登録しました" : "変更を保存しました");
      router.push("/recipes");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("レシピを削除しました");
      router.push("/recipes");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

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
        <form onSubmit={handleSubmit(handleSave)} className="space-y-5 p-4">
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
                  step="0.1"
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
                    step="0.1"
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
                    step="0.1"
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
                    step="0.1"
                    className="border-green-200/80 bg-white font-medium text-green-700 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300"
                    placeholder="0"
                    {...register("carbs")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── 材料セクション ── */}
          <section className="space-y-3">
            <SectionHeader icon={ShoppingBasket} label="材料">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 gap-1 text-xs"
                onClick={handleAddIngredient}
              >
                <Plus className="h-3.5 w-3.5" />
                追加
              </Button>
            </SectionHeader>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              {ingredients.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  「追加」から材料を入力してください
                </p>
              ) : (
                <div className="space-y-2.5">
                  {ingredients.map((ing) => (
                    <div
                      key={ing.tempId}
                      className="relative rounded-lg border border-border/60 bg-white p-3 shadow-sm dark:bg-background"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1.5 top-1.5 h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveIngredient(ing.tempId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-2 pr-7">
                        <Input
                          placeholder="材料名"
                          value={ing.ingredientName}
                          onChange={(e) =>
                            handleIngredientChange(
                              ing.tempId,
                              "ingredientName",
                              e.target.value,
                            )
                          }
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              数量
                            </Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.1"
                              value={ing.quantity || ""}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.tempId,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              単位
                            </Label>
                            <Input
                              placeholder="g, ml..."
                              value={ing.unit}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.tempId,
                                  "unit",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground">
                              単価(円)
                            </Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              value={ing.unitPrice || ""}
                              onChange={(e) =>
                                handleIngredientChange(
                                  ing.tempId,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

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
