import type { Database, Tables } from "@/lib/supabase/database.types";

type Functions = Database["public"]["Functions"];

type WithNullableArgs<
  Fn extends { Args: object },
  Key extends keyof Fn["Args"],
> = Omit<Fn, "Args"> & {
  Args: Omit<Fn["Args"], Key> & { [Arg in Key]: Fn["Args"][Arg] | null };
};

// Postgres cannot mark a function argument nullable, so the generated Args require a string where these
// functions take null (a null id creates a new row)
export type AppDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Functions"> & {
    Functions: Omit<
      Functions,
      "save_recipe_with_ingredients" | "save_set_menu_with_items"
    > & {
      save_recipe_with_ingredients: WithNullableArgs<
        Functions["save_recipe_with_ingredients"],
        "p_id" | "p_notes"
      >;
      save_set_menu_with_items: WithNullableArgs<
        Functions["save_set_menu_with_items"],
        "p_id"
      >;
    };
  };
};

type NutritionColumns =
  | "id"
  | "name"
  | "calories"
  | "protein"
  | "fat"
  | "carbs"
  | "deleted_at";

/** The columns of a food master that meal items and plans show */
export type FoodMasterNutritionRow = Pick<
  Tables<"food_masters">,
  NutritionColumns | "default_price"
>;

/** The columns of a recipe that meal items and plans show */
export type RecipeNutritionRow = Pick<
  Tables<"recipes">,
  NutritionColumns | "servings"
>;
