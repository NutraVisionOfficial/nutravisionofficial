import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useTodayFoodLogs() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["food_logs", "today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useAddFoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      meal_type: string;
      food_name: string;
      emoji: string;
      portion: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      quantity: number;
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("food_logs")
        .insert({ ...entry, user_id: user!.id, date: today });
      if (error) throw error;

      // Recalculate and sync daily_logs totals
      const { data: allLogs } = await supabase
        .from("food_logs")
        .select("calories, protein, carbs, fats")
        .eq("user_id", user!.id)
        .eq("date", today);

      const totals = (allLogs || []).reduce(
        (acc, r) => ({
          total_calories: acc.total_calories + r.calories,
          protein: acc.protein + Number(r.protein),
          carbs: acc.carbs + Number(r.carbs),
          fats: acc.fats + Number(r.fats),
        }),
        { total_calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      await supabase
        .from("daily_logs")
        .upsert(
          { ...totals, user_id: user!.id, date: today },
          { onConflict: "user_id,date" }
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
    },
  });
}

export function useDeleteFoodLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_logs").delete().eq("id", id);
      if (error) throw error;

      // Recalculate daily totals from remaining food logs
      const today = new Date().toISOString().split("T")[0];
      const { data: remaining } = await supabase
        .from("food_logs")
        .select("calories, protein, carbs, fats")
        .eq("user_id", user!.id)
        .eq("date", today);

      const totals = (remaining || []).reduce(
        (acc, r) => ({
          total_calories: acc.total_calories + r.calories,
          protein: acc.protein + Number(r.protein),
          carbs: acc.carbs + Number(r.carbs),
          fats: acc.fats + Number(r.fats),
        }),
        { total_calories: 0, protein: 0, carbs: 0, fats: 0 }
      );

      await supabase
        .from("daily_logs")
        .upsert(
          { ...totals, user_id: user!.id, date: today },
          { onConflict: "user_id,date" }
        );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food_logs"] });
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
    },
  });
}
