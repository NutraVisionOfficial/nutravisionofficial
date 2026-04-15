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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_logs: {
        Row: {
          carbs: number
          created_at: string
          current_weight: number | null
          date: string
          fats: number
          id: string
          protein: number
          total_calories: number
          updated_at: string
          user_id: string
          workout_duration_mins: number
          workout_type: string
        }
        Insert: {
          carbs?: number
          created_at?: string
          current_weight?: number | null
          date?: string
          fats?: number
          id?: string
          protein?: number
          total_calories?: number
          updated_at?: string
          user_id: string
          workout_duration_mins?: number
          workout_type?: string
        }
        Update: {
          carbs?: number
          created_at?: string
          current_weight?: number | null
          date?: string
          fats?: number
          id?: string
          protein?: number
          total_calories?: number
          updated_at?: string
          user_id?: string
          workout_duration_mins?: number
          workout_type?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs: number
          created_at: string
          date: string
          emoji: string
          fats: number
          food_name: string
          id: string
          meal_type: string
          portion: string
          protein: number
          quantity: number
          user_id: string
        }
        Insert: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          emoji?: string
          fats?: number
          food_name: string
          id?: string
          meal_type?: string
          portion?: string
          protein?: number
          quantity?: number
          user_id: string
        }
        Update: {
          calories?: number
          carbs?: number
          created_at?: string
          date?: string
          emoji?: string
          fats?: number
          food_name?: string
          id?: string
          meal_type?: string
          portion?: string
          protein?: number
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          plan_data: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_data?: Json
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      physique_scans: {
        Row: {
          body_fat_percentage: number
          category: string
          created_at: string
          date: string
          id: string
          muscle_mass: string
          notes: string
          photo_url: string
          user_id: string
        }
        Insert: {
          body_fat_percentage: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          muscle_mass?: string
          notes?: string
          photo_url?: string
          user_id: string
        }
        Update: {
          body_fat_percentage?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          muscle_mass?: string
          notes?: string
          photo_url?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          allergies: string[]
          cooking_time: string
          created_at: string
          current_weight: number
          daily_calorie_target: number
          diet_type: string
          goal_timeframe_months: number
          goal_weight: number
          id: string
          meals_per_day: string
          name: string
          start_date: string
          starting_weight: number
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[]
          cooking_time?: string
          created_at?: string
          current_weight?: number
          daily_calorie_target?: number
          diet_type?: string
          goal_timeframe_months?: number
          goal_weight?: number
          id?: string
          meals_per_day?: string
          name?: string
          start_date?: string
          starting_weight?: number
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[]
          cooking_time?: string
          created_at?: string
          current_weight?: number
          daily_calorie_target?: number
          diet_type?: string
          goal_timeframe_months?: number
          goal_weight?: number
          id?: string
          meals_per_day?: string
          name?: string
          start_date?: string
          starting_weight?: number
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          estimated_body_fat: number
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          estimated_body_fat: number
          id?: string
          image_url?: string
          user_id: string
        }
        Update: {
          created_at?: string
          estimated_body_fat?: number
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          created_at: string
          date: string
          glasses: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          glasses?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          glasses?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_subscription_status: { Args: { _user_id: string }; Returns: string }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
