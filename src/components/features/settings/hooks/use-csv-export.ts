"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useSupabase } from "@/hooks";
import { downloadCsv, formatDateToString, toCsv } from "@/utils";

/** CSV export types */
type ExportType = "meals" | "recipes" | "food_masters" | "set_menus";

/** CSV export hook providing download functions for each data type */
export const useCsvExport = () => {
  const supabase = useSupabase();
  const [isExporting, setIsExporting] = useState(false);

  /** Export meal items */
  const exportMeals = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("meal_items")
        .select("*, meals!inner(date, meal_type)")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []).map((item) => ({
        date: (item.meals as { date: string }).date,
        meal_type: (item.meals as { meal_type: string }).meal_type,
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        fat: item.fat,
        carbs: item.carbs,
        cost: item.cost,
        source_type: item.source_type,
      }));

      const csv = toCsv(
        [
          { key: "date", label: "日付" },
          { key: "meal_type", label: "食事タイプ" },
          { key: "name", label: "メニュー名" },
          { key: "calories", label: "カロリー(kcal)" },
          { key: "protein", label: "タンパク質(g)" },
          { key: "fat", label: "脂質(g)" },
          { key: "carbs", label: "炭水化物(g)" },
          { key: "cost", label: "食費(円)" },
          { key: "source_type", label: "登録元" },
        ],
        rows,
      );

      const today = formatDateToString(new Date());
      downloadCsv(csv, `meshilog_meals_${today}.csv`);
      toast.success("食事記録をエクスポートしました");
    } catch (error) {
      console.error("Failed to export meals:", error);
      toast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [supabase]);

  /** Export recipes */
  const exportRecipes = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csv = toCsv(
        [
          { key: "name", label: "レシピ名" },
          { key: "servings", label: "人数" },
          { key: "calories", label: "カロリー(kcal)" },
          { key: "protein", label: "タンパク質(g)" },
          { key: "fat", label: "脂質(g)" },
          { key: "carbs", label: "炭水化物(g)" },
          { key: "notes", label: "メモ" },
        ],
        data ?? [],
      );

      const today = formatDateToString(new Date());
      downloadCsv(csv, `meshilog_recipes_${today}.csv`);
      toast.success("レシピをエクスポートしました");
    } catch (error) {
      console.error("Failed to export recipes:", error);
      toast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [supabase]);

  /** Export food masters */
  const exportFoodMasters = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("food_masters")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const csv = toCsv(
        [
          { key: "name", label: "食品名" },
          { key: "brand", label: "ブランド" },
          { key: "category", label: "カテゴリ" },
          { key: "calories", label: "カロリー(kcal)" },
          { key: "protein", label: "タンパク質(g)" },
          { key: "fat", label: "脂質(g)" },
          { key: "carbs", label: "炭水化物(g)" },
          { key: "default_price", label: "デフォルト価格(円)" },
          { key: "notes", label: "メモ" },
        ],
        data ?? [],
      );

      const today = formatDateToString(new Date());
      downloadCsv(csv, `meshilog_food_masters_${today}.csv`);
      toast.success("食品マスタをエクスポートしました");
    } catch (error) {
      console.error("Failed to export food masters:", error);
      toast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [supabase]);

  /** Export set menus */
  const exportSetMenus = useCallback(async () => {
    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from("set_menus")
        .select("*, set_menu_items(*)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (data ?? []).map((sm) => ({
        name: sm.name,
        total_calories: sm.total_calories,
        total_protein: sm.total_protein,
        total_fat: sm.total_fat,
        total_carbs: sm.total_carbs,
        total_cost: sm.total_cost,
        item_count: Array.isArray(sm.set_menu_items)
          ? sm.set_menu_items.length
          : 0,
      }));

      const csv = toCsv(
        [
          { key: "name", label: "セットメニュー名" },
          { key: "total_calories", label: "合計カロリー(kcal)" },
          { key: "total_protein", label: "合計タンパク質(g)" },
          { key: "total_fat", label: "合計脂質(g)" },
          { key: "total_carbs", label: "合計炭水化物(g)" },
          { key: "total_cost", label: "合計食費(円)" },
          { key: "item_count", label: "アイテム数" },
        ],
        rows,
      );

      const today = formatDateToString(new Date());
      downloadCsv(csv, `meshilog_set_menus_${today}.csv`);
      toast.success("セットメニューをエクスポートしました");
    } catch (error) {
      console.error("Failed to export set menus:", error);
      toast.error("エクスポートに失敗しました");
    } finally {
      setIsExporting(false);
    }
  }, [supabase]);

  /** Export by type */
  const exportByType = useCallback(
    async (type: ExportType) => {
      switch (type) {
        case "meals":
          return exportMeals();
        case "recipes":
          return exportRecipes();
        case "food_masters":
          return exportFoodMasters();
        case "set_menus":
          return exportSetMenus();
      }
    },
    [exportMeals, exportRecipes, exportFoodMasters, exportSetMenus],
  );

  return { isExporting, exportByType };
};
