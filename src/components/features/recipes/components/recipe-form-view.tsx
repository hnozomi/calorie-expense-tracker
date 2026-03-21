"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Header, PageContainer } from "@/components/features/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
        <Header title="レシピ" />
        <PageContainer>
          <div className="p-4">読み込み中...</div>
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
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 p-4">
          {/* Basic info */}
          <div className="space-y-1">
            <Label htmlFor="recipe-name">レシピ名 *</Label>
            <Input
              id="recipe-name"
              placeholder="例: 鶏むね肉のサラダ"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="recipe-servings">何人分 *</Label>
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

          <Separator />

          {/* Nutrition (total for recipe) */}
          <p className="text-sm font-medium">栄養成分（合計）</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="recipe-calories">カロリー (kcal)</Label>
              <Input
                id="recipe-calories"
                type="number"
                inputMode="decimal"
                {...register("calories")}
              />
            </div>
            <div className="space-y-1">
              <Label>食費合計</Label>
              <p className="flex h-9 items-center text-sm text-muted-foreground">
                ¥{Math.round(totalIngredientCost)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="recipe-protein">P (g)</Label>
              <Input
                id="recipe-protein"
                type="number"
                inputMode="decimal"
                {...register("protein")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recipe-fat">F (g)</Label>
              <Input
                id="recipe-fat"
                type="number"
                inputMode="decimal"
                {...register("fat")}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="recipe-carbs">C (g)</Label>
              <Input
                id="recipe-carbs"
                type="number"
                inputMode="decimal"
                {...register("carbs")}
              />
            </div>
          </div>

          <Separator />

          {/* Ingredients */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">材料</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddIngredient}
            >
              <Plus className="mr-1 h-4 w-4" />
              追加
            </Button>
          </div>

          {ingredients.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              「追加」から材料を入力してください
            </p>
          ) : (
            <div className="space-y-3">
              {ingredients.map((ing) => (
                <div
                  key={ing.tempId}
                  className="flex items-start gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1 space-y-2">
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
                      <Input
                        placeholder="数量"
                        type="number"
                        inputMode="decimal"
                        value={ing.quantity || ""}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.tempId,
                            "quantity",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="単位"
                        value={ing.unit}
                        onChange={(e) =>
                          handleIngredientChange(
                            ing.tempId,
                            "unit",
                            e.target.value,
                          )
                        }
                      />
                      <Input
                        placeholder="単価(円)"
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveIngredient(ing.tempId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Notes */}
          <div className="space-y-1">
            <Label htmlFor="recipe-notes">メモ</Label>
            <Textarea
              id="recipe-notes"
              placeholder="調理手順や備考..."
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
                このレシピを削除する
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

export { RecipeFormView };
