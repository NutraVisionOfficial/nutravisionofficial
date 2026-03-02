import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useWeightLogs(days = 30) {
  const { user } = useAuth();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return useQuery({
    queryKey: ["weight_logs", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user!.id)
        .gte("date", since.toISOString().split("T")[0])
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertWeight() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weight: number) => {
      const today = new Date().toISOString().split("T")[0];
      const { error } = await supabase
        .from("weight_logs")
        .upsert(
          { user_id: user!.id, date: today, weight },
          { onConflict: "user_id,date" }
        );
      if (error) throw error;

      // Also update profile current_weight
      await supabase
        .from("profiles")
        .update({ current_weight: weight })
        .eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weight_logs"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
