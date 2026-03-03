import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Meal {
  slot: string;
  name: string;
  emoji: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  cook_time_mins: number;
  portion: string;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
}

export interface WeekPlan {
  days: DayPlan[];
}

export function useGenerateMealPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const generate = async (prefs: {
    dietType: string;
    allergies: string[];
    cookingTime: string;
    mealsPerDay: string;
    calorieTarget: number;
  }): Promise<WeekPlan | null> => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meal-plan", {
        body: prefs,
      });

      if (error) {
        toast({ title: "Generation failed", description: error.message, variant: "destructive" });
        return null;
      }

      if (data?.error) {
        toast({ title: "AI Error", description: data.error, variant: "destructive" });
        return null;
      }

      const plan = data as WeekPlan;

      // Save to meal_plans table
      const weekStart = getMonday();
      await supabase.from("meal_plans").upsert(
        {
          user_id: user!.id,
          week_start: weekStart,
          plan_data: plan as any,
        },
        { onConflict: "user_id,week_start" }
      );

      queryClient.invalidateQueries({ queryKey: ["meal_plan"] });

      return plan;
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to generate plan", variant: "destructive" });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating };
}

export function useCurrentMealPlan() {
  const { user } = useAuth();
  const weekStart = getMonday();

  return useQuery({
    queryKey: ["meal_plan", user?.id, weekStart],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user!.id)
        .eq("week_start", weekStart)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data.plan_data as unknown as WeekPlan;
    },
  });
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split("T")[0];
}
