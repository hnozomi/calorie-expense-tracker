"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Minus, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useFoodMasters } from "@/components/features/food-masters/hooks/use-food-masters";
import { Header, PageContainer } from "@/components/features/layout";
import { useRecipes } from "@/components/features/recipes/hooks/use-recipes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks";
import { useDeleteSetMenu } from "../hooks/use-delete-set-menu";
import { useSaveSetMenu } from "../hooks/use-save-set-menu";
import { useSetMenuDetail } from "../hooks/use-set-menu-detail";
import type {
  SetMenuFormValues,
  SetMenuItem,
  SetMenuItemDraft,
} from "../types/set-menu";
import { setMenuFormSchema } from "../types/set-menu";

type SetMenuFormViewProps = {
  id: string;
};

/** Form view for creating or editing a set menu */
const SetMenuFormView = ({ id }: SetMenuFormViewProps) => {
  const router = useRouter();
  const isNew = id === "new";
  const { data: existing, isLoading } = useSetMenuDetail(
    isNew ? undefined : id,
  );
  const saveMutation = useSaveSetMenu();
  const deleteMutation = useDeleteSetMenu();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [fmSearch, setFmSearch] = useState("");
  const debouncedRecipeSearch = useDebounce(recipeSearch);
  const debouncedFmSearch = useDebounce(fmSearch);
  const { data: recipes } = useRecipes(debouncedRecipeSearch);
  const { data: foodMasters } = useFoodMasters(debouncedFmSearch);

  /** Items in the set menu */
  const [items, setItems] = useState<SetMenuItemDraft[]>([]);

  /** Sync items from existing data when loaded */
  const [hasInitialized, setHasInitialized] = useState(false);
  if (existing && !hasInitialized && !isNew) {
    setItems(
      existing.items.map((item: SetMenuItem) => ({
        tempId: crypto.randomUUID(),
        name: item.name,
        recipeId: item.recipeId,
        foodMasterId: item.foodMasterId,
        calories: item.calories,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        cost: item.cost,
        servingQuantity: item.servingQuantity,
      })),
    );
    setHasInitialized(true);
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetMenuFormValues>({
    resolver: zodResolver(setMenuFormSchema) as Resolver<SetMenuFormValues>,
    values: existing ? { name: existing.name } : { name: "" },
  });

  /** Add a recipe to items (1 serving = per-person values) */
  const handleAddRecipe = useCallback(
    (recipe: NonNullable<typeof recipes>[number]) => {
      setItems((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          name: recipe.name,
          recipeId: recipe.id,
          foodMasterId: null,
          calories: recipe.calories / recipe.servings,
          protein: recipe.protein / recipe.servings,
          fat: recipe.fat / recipe.servings,
          carbs: recipe.carbs / recipe.servings,
          cost:
            recipe.ingredients.reduce(
              (sum, ing) => sum + ing.unitPrice * ing.quantity,
              0,
            ) / recipe.servings,
          servingQuantity: 1,
        },
      ]);
    },
    [],
  );

  /** Add a food master to items */
  const handleAddFoodMaster = useCallback(
    (fm: NonNullable<typeof foodMasters>[number]) => {
      setItems((prev) => [
        ...prev,
        {
          tempId: crypto.randomUUID(),
          name: fm.name,
          recipeId: null,
          foodMasterId: fm.id,
          calories: fm.calories,
          protein: fm.protein,
          fat: fm.fat,
          carbs: fm.carbs,
          cost: fm.defaultPrice ?? 0,
          servingQuantity: 1,
        },
      ]);
    },
    [],
  );

  /** Remove item */
  const handleRemoveItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  /** Adjust serving quantity by delta (±0.5) */
  const handleAdjustQuantity = useCallback((tempId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        const newQty = Math.max(0.5, item.servingQuantity + delta);
        return { ...item, servingQuantity: newQty };
      }),
    );
  }, []);

  /** Calculate totals */
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories * item.servingQuantity,
      protein: acc.protein + item.protein * item.servingQuantity,
      fat: acc.fat + item.fat * item.servingQuantity,
      carbs: acc.carbs + item.carbs * item.servingQuantity,
      cost: acc.cost + item.cost * item.servingQuantity,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, cost: 0 },
  );

  const handleSave = async (values: SetMenuFormValues) => {
    if (items.length === 0) {
      toast.error("アイテムを1つ以上追加してください");
      return;
    }

    try {
      await saveMutation.mutateAsync({
        id: isNew ? undefined : id,
        name: values.name,
        items,
      });
      toast.success(
        isNew ? "セットメニューを登録しました" : "変更を保存しました",
      );
      router.push("/other/set-menus");
    } catch {
      toast.error("保存に失敗しました");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("セットメニューを削除しました");
      router.push("/other/set-menus");
    } catch {
      toast.error("削除に失敗しました");
    }
  };

  if (!isNew && isLoading) {
    return (
      <>
        <Header title="セットメニュー" />
        <PageContainer>
          <div className="p-4">読み込み中...</div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title={isNew ? "セットメニューを登録" : "セットメニューを編集"}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/other/set-menus")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </Header>
      <PageContainer>
        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 p-4">
          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="sm-name">セットメニュー名 *</Label>
            <Input
              id="sm-name"
              placeholder="例: 朝定食セット"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <Separator />

          {/* Items */}
          <p className="text-sm font-medium">構成アイテム</p>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.tempId}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {item.recipeId ? "レシピ" : "マスタ"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round(item.calories * item.servingQuantity)} kcal ·
                      ¥{Math.round(item.cost * item.servingQuantity)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleAdjustQuantity(item.tempId, -0.5)}
                      disabled={item.servingQuantity <= 0.5}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">
                      {item.servingQuantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      onClick={() => handleAdjustQuantity(item.tempId, 0.5)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveItem(item.tempId)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Totals preview */}
          {items.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-medium">
                合計: {Math.round(totals.calories)} kcal · ¥
                {Math.round(totals.cost)}
              </p>
              <p className="text-xs text-muted-foreground">
                P:{totals.protein.toFixed(1)} F:{totals.fat.toFixed(1)} C:
                {totals.carbs.toFixed(1)}
              </p>
            </div>
          )}

          <Separator />

          {/* Add items from recipes or food masters */}
          <p className="text-sm font-medium">アイテムを追加</p>
          <Tabs defaultValue="recipe">
            <TabsList className="w-full">
              <TabsTrigger value="recipe" className="flex-1">
                レシピから
              </TabsTrigger>
              <TabsTrigger value="food_master" className="flex-1">
                マスタから
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recipe" className="mt-2">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="レシピ名で検索..."
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {recipes && recipes.length > 0 ? (
                    recipes.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleAddRecipe(recipe)}
                      >
                        <span className="truncate">{recipe.name}</span>
                        <span className="ml-2 whitespace-nowrap text-muted-foreground">
                          {Math.round(recipe.calories / recipe.servings)}{" "}
                          kcal/人
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      {recipeSearch
                        ? "該当するレシピがありません"
                        : "レシピが未登録です"}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="food_master" className="mt-2">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="食品名で検索..."
                    value={fmSearch}
                    onChange={(e) => setFmSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {foodMasters && foodMasters.length > 0 ? (
                    foodMasters.map((fm) => (
                      <button
                        key={fm.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => handleAddFoodMaster(fm)}
                      >
                        <span className="truncate">{fm.name}</span>
                        <span className="ml-2 whitespace-nowrap text-muted-foreground">
                          {Math.round(fm.calories)} kcal
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="py-3 text-center text-sm text-muted-foreground">
                      {fmSearch
                        ? "該当する食品がありません"
                        : "食品マスタが未登録です"}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            className="w-full"
            disabled={saveMutation.isPending || items.length === 0}
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
                このセットメニューを削除する
              </button>

              {isDeleteConfirmOpen && (
                <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <p className="text-sm font-medium">
                    「{existing?.name}」を削除しますか？
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

export { SetMenuFormView };
