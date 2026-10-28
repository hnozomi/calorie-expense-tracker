import { getTodayString } from "@/utils";

export type CsvExportType = "meals" | "recipes" | "food_masters" | "set_menus";

/** Date range option applied to the meal export */
export type CsvExportPeriod = "all" | "this_month" | "last_month";

export const CSV_EXPORT_PERIOD_LABELS: Record<CsvExportPeriod, string> = {
  all: "全期間",
  this_month: "今月",
  last_month: "先月",
};

export type CsvRow = Record<string, string | number | null | undefined>;

type CsvHeader = {
  key: string;
  label: string;
};

type CsvExportDefinition = {
  filenamePrefix: string;
  headers: CsvHeader[];
  successMessage: string;
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
};

export const csvExportDefinitions = {
  meals: mealExportDefinition,
  recipes: recipeExportDefinition,
  food_masters: foodMasterExportDefinition,
  set_menus: setMenuExportDefinition,
} satisfies Record<CsvExportType, CsvExportDefinition>;

export const buildCsvFilename = (prefix: string) =>
  `${prefix}_${todaySuffix()}.csv`;
