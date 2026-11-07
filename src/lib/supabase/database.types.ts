export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      food_masters: {
        Row: {
          brand: string | null
          calories: number
          carbs: number
          category: string | null
          created_at: string
          default_price: number | null
          deleted_at: string | null
          fat: number
          id: string
          name: string
          notes: string | null
          protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          default_price?: number | null
          deleted_at?: string | null
          fat?: number
          id?: string
          name: string
          notes?: string | null
          protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          calories?: number
          carbs?: number
          category?: string | null
          created_at?: string
          default_price?: number | null
          deleted_at?: string | null
          fat?: number
          id?: string
          name?: string
          notes?: string | null
          protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_item_costs: {
        Row: {
          id: string
          item_name: string
          meal_item_id: string
          quantity: number
          subtotal: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          item_name: string
          meal_item_id: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Update: {
          id?: string
          item_name?: string
          meal_item_id?: string
          quantity?: number
          subtotal?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "meal_item_costs_meal_item_id_fkey"
            columns: ["meal_item_id"]
            isOneToOne: false
            referencedRelation: "meal_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number
          carbs: number
          cost: number | null
          created_at: string
          fat: number
          food_master_id: string | null
          id: string
          meal_id: string
          name: string
          protein: number
          recipe_id: string | null
          serving_quantity: number
          set_menu_id: string | null
          sort_order: number
          source_type: string
          updated_at: string
        }
        Insert: {
          calories?: number
          carbs?: number
          cost?: number | null
          created_at?: string
          fat?: number
          food_master_id?: string | null
          id?: string
          meal_id: string
          name: string
          protein?: number
          recipe_id?: string | null
          serving_quantity?: number
          set_menu_id?: string | null
          sort_order?: number
          source_type?: string
          updated_at?: string
        }
        Update: {
          calories?: number
          carbs?: number
          cost?: number | null
          created_at?: string
          fat?: number
          food_master_id?: string | null
          id?: string
          meal_id?: string
          name?: string
          protein?: number
          recipe_id?: string | null
          serving_quantity?: number
          set_menu_id?: string | null
          sort_order?: number
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_items_food_master_id_fkey"
            columns: ["food_master_id"]
            isOneToOne: false
            referencedRelation: "food_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_items_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          date: string
          estimated_cost: number
          fat: number
          food_master_id: string | null
          id: string
          is_transferred: boolean
          meal_type: string
          planned_name: string
          protein: number
          recipe_id: string | null
          set_menu_id: string | null
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          date: string
          estimated_cost?: number
          fat?: number
          food_master_id?: string | null
          id?: string
          is_transferred?: boolean
          meal_type: string
          planned_name: string
          protein?: number
          recipe_id?: string | null
          set_menu_id?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          estimated_cost?: number
          fat?: number
          food_master_id?: string | null
          id?: string
          is_transferred?: boolean
          meal_type?: string
          planned_name?: string
          protein?: number
          recipe_id?: string | null
          set_menu_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_food_master_id_fkey"
            columns: ["food_master_id"]
            isOneToOne: false
            referencedRelation: "food_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plans_set_menu_id_fkey"
            columns: ["set_menu_id"]
            isOneToOne: false
            referencedRelation: "set_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          date: string
          id: string
          meal_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          meal_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          meal_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ocr_scans: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_name: string
          quantity: number
          recipe_id: string
          unit: string
          unit_price: number
        }
        Insert: {
          id?: string
          ingredient_name: string
          quantity?: number
          recipe_id: string
          unit?: string
          unit_price?: number
        }
        Update: {
          id?: string
          ingredient_name?: string
          quantity?: number
          recipe_id?: string
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          deleted_at: string | null
          fat: number
          id: string
          name: string
          notes: string | null
          protein: number
          servings: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          deleted_at?: string | null
          fat?: number
          id?: string
          name: string
          notes?: string | null
          protein?: number
          servings?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          deleted_at?: string | null
          fat?: number
          id?: string
          name?: string
          notes?: string | null
          protein?: number
          servings?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      set_menu_items: {
        Row: {
          calories: number
          carbs: number
          cost: number
          fat: number
          food_master_id: string | null
          id: string
          name: string
          protein: number
          recipe_id: string | null
          serving_quantity: number
          set_menu_id: string
          sort_order: number
        }
        Insert: {
          calories?: number
          carbs?: number
          cost?: number
          fat?: number
          food_master_id?: string | null
          id?: string
          name: string
          protein?: number
          recipe_id?: string | null
          serving_quantity?: number
          set_menu_id: string
          sort_order?: number
        }
        Update: {
          calories?: number
          carbs?: number
          cost?: number
          fat?: number
          food_master_id?: string | null
          id?: string
          name?: string
          protein?: number
          recipe_id?: string | null
          serving_quantity?: number
          set_menu_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "set_menu_items_food_master_id_fkey"
            columns: ["food_master_id"]
            isOneToOne: false
            referencedRelation: "food_masters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_menu_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_menu_items_set_menu_id_fkey"
            columns: ["set_menu_id"]
            isOneToOne: false
            referencedRelation: "set_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      set_menus: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          total_calories: number
          total_carbs: number
          total_cost: number
          total_fat: number
          total_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          total_calories?: number
          total_carbs?: number
          total_cost?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          total_calories?: number
          total_carbs?: number
          total_cost?: number
          total_fat?: number
          total_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          target_calories: number
          target_carbs: number
          target_fat: number
          target_protein: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_calories?: number
          target_carbs?: number
          target_fat?: number
          target_protein?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_calories?: number
          target_carbs?: number
          target_fat?: number
          target_protein?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_ocr_scan: { Args: { p_daily_limit: number }; Returns: boolean }
      get_daily_summary: {
        Args: { p_target_date: string }
        Returns: {
          item_count: number
          meal_type: string
          total_calories: number
          total_carbs: number
          total_cost: number
          total_fat: number
          total_protein: number
        }[]
      }
      get_weekly_summary: {
        Args: { p_start_date: string }
        Returns: {
          date: string
          total_calories: number
          total_carbs: number
          total_cost: number
          total_fat: number
          total_protein: number
        }[]
      }
      register_meal_items: {
        Args: { p_items: Json; p_meal_id: string }
        Returns: {
          calories: number
          carbs: number
          cost: number | null
          created_at: string
          fat: number
          food_master_id: string | null
          id: string
          meal_id: string
          name: string
          protein: number
          recipe_id: string | null
          serving_quantity: number
          set_menu_id: string | null
          sort_order: number
          source_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "meal_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      register_set_menu_to_meal: {
        Args: { p_meal_id: string; p_set_menu_id: string }
        Returns: {
          calories: number
          carbs: number
          cost: number | null
          created_at: string
          fat: number
          food_master_id: string | null
          id: string
          meal_id: string
          name: string
          protein: number
          recipe_id: string | null
          serving_quantity: number
          set_menu_id: string | null
          sort_order: number
          source_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "meal_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      save_recipe_with_ingredients: {
        Args: {
          p_calories: number
          p_carbs: number
          p_fat: number
          p_id: string
          p_ingredients: Json
          p_name: string
          p_notes: string
          p_protein: number
          p_servings: number
        }
        Returns: string
      }
      save_set_menu_with_items: {
        Args: {
          p_id: string
          p_items: Json
          p_name: string
          p_total_calories: number
          p_total_carbs: number
          p_total_cost: number
          p_total_fat: number
          p_total_protein: number
        }
        Returns: string
      }
      sync_meals_to_plans: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: number
      }
      transfer_meal_to_plan: {
        Args: { p_meal_type: string; p_target_date: string }
        Returns: undefined
      }
      transfer_plan_to_meal: {
        Args: { p_meal_type: string; p_target_date: string }
        Returns: {
          calories: number
          carbs: number
          cost: number | null
          created_at: string
          fat: number
          food_master_id: string | null
          id: string
          meal_id: string
          name: string
          protein: number
          recipe_id: string | null
          serving_quantity: number
          set_menu_id: string | null
          sort_order: number
          source_type: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "meal_items"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
