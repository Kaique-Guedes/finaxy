import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useMonthlyNote(monthKey: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["monthly_note", user?.id, monthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_notes")
        .select("*")
        .eq("user_id", user!.id)
        .eq("month_key", monthKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!monthKey,
  });
}

export function useSaveMonthlyNote() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ monthKey, content }: { monthKey: string; content: string }) => {
      const { error } = await supabase
        .from("monthly_notes")
        .upsert(
          { user_id: user!.id, month_key: monthKey, content },
          { onConflict: "user_id,month_key" }
        );
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["monthly_note", user?.id, vars.monthKey] });
      toast.success("Observações salvas!");
    },
    onError: () => toast.error("Erro ao salvar observações"),
  });
}
