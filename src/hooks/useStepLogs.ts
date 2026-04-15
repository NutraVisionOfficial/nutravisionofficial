import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const today = () => new Date().toISOString().split("T")[0];

export function useTodaySteps() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["step_logs", "today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("step_logs")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertSteps() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (steps: number) => {
      const { error } = await supabase
        .from("step_logs")
        .upsert(
          { user_id: user!.id, date: today(), steps },
          { onConflict: "user_id,date" }
        );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["step_logs"] }),
  });
}
