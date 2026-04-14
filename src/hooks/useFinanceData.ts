import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type Transaction = {
  id: string;
  user_id: string;
  type: "income" | "expense" | "investment";
  description: string;
  amount: number;
  category: string;
  date: string;
  recurrence: "once" | "monthly" | "variable";
  created_at: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  monthly_limit: number;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  months: number;
  icon: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  monthly_salary: number;
  created_at: string;
  updated_at: string;
};

// ---- Profile ----
export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, "name" | "monthly_salary">>) => {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Perfil atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar perfil"),
  });
}

// ---- Transactions ----
export function useTransactions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });
}

export function useAddTransaction() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tx: Omit<Transaction, "id" | "user_id" | "created_at">) => {
      const { error } = await supabase.from("transactions").insert({ ...tx, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação salva!");
    },
    onError: () => toast.error("Erro ao salvar transação"),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação removida!");
    },
  });
}

// ---- Categories ----
export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["categories", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user,
  });
}

export function useAddCategory() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Pick<Category, "name" | "icon" | "color" | "monthly_limit">) => {
      const { error } = await supabase.from("categories").insert({ ...cat, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria criada!");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });
}

// ---- Goals ----
export function useGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });
}

export function useAddGoal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (goal: Pick<Goal, "name" | "target_amount" | "saved_amount" | "months" | "icon">) => {
      const { error } = await supabase.from("goals").insert({ ...goal, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta criada!");
    },
    onError: () => toast.error("Erro ao criar meta"),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Goal>) => {
      const { error } = await supabase.from("goals").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta atualizada!");
    },
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Meta removida!");
    },
  });
}

// ---- Finance helpers ----
export function useFinanceSummary() {
  const { data: profile } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();

  const salary = Number(profile?.monthly_salary || 0);
  const extraIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const fixedExpenses = transactions
    .filter((t) => t.type === "expense" && t.recurrence === "monthly")
    .reduce((s, t) => s + Number(t.amount), 0);
  const variableExpenses = transactions
    .filter((t) => t.type === "expense" && t.recurrence !== "monthly")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = fixedExpenses + variableExpenses;
  const investments = transactions
    .filter((t) => t.type === "investment")
    .reduce((s, t) => s + Number(t.amount), 0);
  const goalContributions = goals.reduce((s, g) => s + Number(g.saved_amount), 0);

  const totalIncome = salary + extraIncome;
  const available = totalIncome - totalExpenses - investments;

  return {
    salary,
    extraIncome,
    totalIncome,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    investments,
    goalContributions,
    available,
  };
}
