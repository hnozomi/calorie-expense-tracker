import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CsvExportPeriod,
  CsvExportType,
  CsvRow,
} from "@/components/features/settings/csv-export-config";
import { formatDateToString, getTodayInTokyo } from "@/utils";

// The Supabase client has no generated types, so joined rows arrive untyped; the casts follow the select strings below

// The rows are read on the server (UTC), so "this month" is decided in Asia/Tokyo, like "today" elsewhere
/** First and last day of the month shifted by offsetMonths from now */
const getMonthRange = (offsetMonths: number) => {
  const [year, month] = getTodayInTokyo().split("-").map(Number);
  const start = new Date(year, month - 1 + offsetMonths, 1);
  const end = new Date(year, month + offsetMonths, 0);
  return { start: formatDateToString(start), end: formatDateToString(end) };
};

const fetchMealRows = async (
  supabase: SupabaseClient,
  period: CsvExportPeriod,
): Promise<CsvRow[]> => {
  let query = supabase
    .from("meal_items")
    .select("*, meals!inner(date, meal_type)")
    .order("created_at", { ascending: false });

  if (period !== "all") {
    const range = getMonthRange(period === "this_month" ? 0 : -1);
    query = query.gte("meals.date", range.start).lte("meals.date", range.end);
  }

  const { data, error } = await query;

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
};

const fetchRecipeRows = async (supabase: SupabaseClient): Promise<CsvRow[]> => {
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

const fetchFoodMasterRows = async (
  supabase: SupabaseClient,
): Promise<CsvRow[]> => {
  const { data, error } = await supabase
    .from("food_masters")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
};

const fetchSetMenuRows = async (
  supabase: SupabaseClient,
): Promise<CsvRow[]> => {
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
};

/** The rows of one CSV export, read with the signed-in user's client (RLS keeps them to the user's own) */
export const fetchCsvRows = (
  supabase: SupabaseClient,
  type: CsvExportType,
  period: CsvExportPeriod,
): Promise<CsvRow[]> => {
  switch (type) {
    case "meals":
      return fetchMealRows(supabase, period);
    case "recipes":
      return fetchRecipeRows(supabase);
    case "food_masters":
      return fetchFoodMasterRows(supabase);
    case "set_menus":
      return fetchSetMenuRows(supabase);
  }
};
