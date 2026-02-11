import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useDailyLogs(days = 30) {
  const { user } = useAuth();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return useQuery({
    queryKey: ["daily_logs", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useTodayLog() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["daily_logs", "today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (log: {
      total_calories: number;
      protein: number;
      carbs: number;
      fats: number;
      workout_type: string;
      workout_duration_mins: number;
      current_weight?: number;
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          { ...log, user_id: user!.id, date: today },
          { onConflict: "user_id,date" }
        );
      if (error) throw error;

      // Also update current weight on profile if provided
      if (log.current_weight) {
        await supabase
          .from("profiles")
          .update({ current_weight: log.current_weight })
          .eq("user_id", user!.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily_logs"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["streak", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("date, workout_type")
        .eq("user_id", user!.id)
        .order("date", { ascending: false })
        .limit(60);
      if (error) throw error;

      let streak = 0;
      for (const log of data || []) {
        if (log.workout_type !== "Rest") streak++;
        else break;
      }
      return streak;
    },
  });
}
