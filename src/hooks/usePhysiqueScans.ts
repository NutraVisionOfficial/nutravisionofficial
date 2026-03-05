import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PhysiqueScan {
  id: string;
  user_id: string;
  date: string;
  body_fat_percentage: number;
  category: string;
  muscle_mass: string;
  notes: string;
  photo_url: string;
  created_at: string;
}

export function usePhysiqueScans() {
  const { session } = useAuth();
  return useQuery({
    queryKey: ["physique-scans", session?.user?.id],
    enabled: !!session?.user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("physique_scans" as any)
        .select("*")
        .eq("user_id", session!.user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as PhysiqueScan[];
    },
  });
}

export function useSavePhysiqueScan() {
  const { session } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (scan: {
      body_fat_percentage: number;
      category: string;
      muscle_mass: string;
      notes: string;
      photoBase64: string;
    }) => {
      const userId = session!.user.id;

      const fileName = `${userId}/${Date.now()}.jpg`;
      const base64Data = scan.photoBase64.split(",")[1];
      const byteArray = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from("physique-photos")
        .upload(fileName, byteArray, { contentType: "image/jpeg", upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("physique-photos")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("physique_scans" as any)
        .insert({
          user_id: userId,
          body_fat_percentage: scan.body_fat_percentage,
          category: scan.category,
          muscle_mass: scan.muscle_mass,
          notes: scan.notes,
          photo_url: urlData.publicUrl,
        } as any);

      if (insertError) throw insertError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physique-scans"] });
    },
  });
}

export function useDeletePhysiqueScan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (scanId: string) => {
      const { error } = await supabase
        .from("physique_scans" as any)
        .delete()
        .eq("id", scanId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["physique-scans"] });
    },
  });
}
