import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const today = () => new Date().toISOString().split("T")[0];

export function useTodayWater() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["water_intake", user?.id, today()],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("water_intake")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertWater() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (glasses: number) => {
      const { error } = await supabase
        .from("water_intake")
        .upsert(
          { user_id: user!.id, date: today(), glasses },
          { onConflict: "user_id,date" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["water_intake"] });
    },
  });
}
