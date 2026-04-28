import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface SavedFood {
  id: string;
  food_name: string;
  emoji: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function useSavedFoods() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["saved_foods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_foods")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedFood[];
    },
  });
}

export function useSaveFood() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (food: Omit<SavedFood, "id">) => {
      const { error } = await supabase
        .from("saved_foods")
        .insert({ ...food, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved_foods"] }),
  });
}

export function useDeleteSavedFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("saved_foods").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved_foods"] }),
  });
}
