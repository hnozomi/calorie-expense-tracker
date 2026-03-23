import type { SupabaseClient } from "@supabase/supabase-js";
import { getTodayString } from "@/utils";

export type CsvExportType = "meals" | "recipes" | "food_masters" | "set_menus";

export type CsvRow = Record<string, string | number | null | undefined>;

type CsvHeader = {
  key: string;
  label: string;
};

type CsvExportDefinition = {
  filenamePrefix: string;
  headers: CsvHeader[];
  successMessage: string;
  fetchRows: (supabase: SupabaseClient) => Promise<CsvRow[]>;
};

const todaySuffix = () => getTodayString();

const mealExportDefinition: CsvExportDefinition = {
  filenamePrefix: "meshilog_meals",
  successMessage: "食事記録をエクスポートしました",
  headers: [
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
  fetchRows: async (supabase) => {
    const { data, error } = await supabase
      .from("meal_items")
      .select("*, meals!inner(date, meal_type)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((item) => ({
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
  },
};

const recipeExportDefinition: CsvExportDefinition = {
  filenamePrefix: "meshilog_recipes",
  successMessage: "レシピをエクスポートしました",
  headers: [
    { key: "name", label: "レシピ名" },
    { key: "servings", label: "人数" },
    { key: "calories", label: "カロリー(kcal)" },
    { key: "protein", label: "タンパク質(g)" },
    { key: "fat", label: "脂質(g)" },
    { key: "carbs", label: "炭水化物(g)" },
    { key: "notes", label: "メモ" },
  ],
  fetchRows: async (supabase) => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
  },
};

const foodMasterExportDefinition: CsvExportDefinition = {
  filenamePrefix: "meshilog_food_masters",
  successMessage: "食品マスタをエクスポートしました",
  headers: [
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
  fetchRows: async (supabase) => {
    const { data, error } = await supabase
      .from("food_masters")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data ?? [];
  },
};

const setMenuExportDefinition: CsvExportDefinition = {
  filenamePrefix: "meshilog_set_menus",
  successMessage: "セットメニューをエクスポートしました",
  headers: [
    { key: "name", label: "セットメニュー名" },
    { key: "total_calories", label: "合計カロリー(kcal)" },
    { key: "total_protein", label: "合計タンパク質(g)" },
    { key: "total_fat", label: "合計脂質(g)" },
    { key: "total_carbs", label: "合計炭水化物(g)" },
    { key: "total_cost", label: "合計食費(円)" },
    { key: "item_count", label: "アイテム数" },
  ],
  fetchRows: async (supabase) => {
    const { data, error } = await supabase
      .from("set_menus")
      .select("*, set_menu_items(*)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data ?? []).map((setMenu) => ({
      name: setMenu.name,
      total_calories: setMenu.total_calories,
      total_protein: setMenu.total_protein,
      total_fat: setMenu.total_fat,
      total_carbs: setMenu.total_carbs,
      total_cost: setMenu.total_cost,
      item_count: Array.isArray(setMenu.set_menu_items)
        ? setMenu.set_menu_items.length
        : 0,
    }));
  },
};

export const csvExportDefinitions = {
  meals: mealExportDefinition,
  recipes: recipeExportDefinition,
  food_masters: foodMasterExportDefinition,
  set_menus: setMenuExportDefinition,
} satisfies Record<CsvExportType, CsvExportDefinition>;

export const buildCsvFilename = (prefix: string) =>
  `${prefix}_${todaySuffix()}.csv`;
