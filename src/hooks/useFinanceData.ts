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
  paid: boolean;
  is_recurring: boolean;
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
    mutationFn: async (tx: Partial<Omit<Transaction, "id" | "user_id" | "created_at">> & { type: Transaction["type"]; description: string; amount: number; category: string; date: string; recurrence: Transaction["recurrence"] }) => {
      const { error } = await supabase.from("transactions").insert({
        ...tx,
        amount: Number(tx.amount),
        user_id: user!.id,
      });
      if (error) {
        console.error("Transaction insert error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transação salva!");
    },
    onError: (err) => {
      console.error("Transaction mutation error:", err);
      toast.error("Erro ao salvar transação");
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Transaction>) => {
      const { error } = await supabase.from("transactions").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
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

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<Pick<Category, "name" | "icon" | "color" | "monthly_limit">>) => {
      const { error } = await supabase.from("categories").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria atualizada!");
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });
}

// ---- Goals ----
export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Categoria removida!");
    },
    onError: () => toast.error("Erro ao remover categoria"),
  });
}

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
    onError: () => toast.error("Erro ao atualizar meta"),
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
    onError: () => toast.error("Erro ao remover meta"),
  });
}

// ---- Finance helpers ----
export function getMonthKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d + (d.length <= 10 ? "T12:00" : "")) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function useFinanceSummary(monthKey?: string) {
  const { data: profile } = useProfile();
  const { data: allTx = [] } = useTransactions();

  const key = monthKey || getMonthKey(new Date());
  const transactions = allTx.filter((t) => getMonthKey(t.date) === key);

  const salary = Number(profile?.monthly_salary || 0);
  const salaryRecurring = transactions
    .filter((t) => t.type === "income" && t.is_recurring)
    .reduce((s, t) => s + Number(t.amount), 0);
  const extraIncome = transactions
    .filter((t) => t.type === "income" && !t.is_recurring)
    .reduce((s, t) => s + Number(t.amount), 0);
  const fixedExpenses = transactions
    .filter((t) => t.type === "expense" && t.recurrence === "monthly")
    .reduce((s, t) => s + Number(t.amount), 0);
  const variableExpenses = transactions
    .filter((t) => t.type === "expense" && t.recurrence !== "monthly")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = fixedExpenses + variableExpenses;
  const paidExpenses = transactions
    .filter((t) => t.type === "expense" && t.paid)
    .reduce((s, t) => s + Number(t.amount), 0);
  const pendingExpenses = totalExpenses - paidExpenses;
  const investments = transactions
    .filter((t) => t.type === "investment")
    .reduce((s, t) => s + Number(t.amount), 0);

  const totalIncome = salaryRecurring + extraIncome || salary + extraIncome;
  const available = totalIncome - totalExpenses - investments;

  return {
    salary,
    extraIncome,
    totalIncome,
    fixedExpenses,
    variableExpenses,
    totalExpenses,
    paidExpenses,
    pendingExpenses,
    investments,
    available,
    transactions,
  };
}

// Auto-create recurring salary entry for the current month if missing
export function useEnsureMonthlySalary() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: allTx = [] } = useTransactions();
  const qc = useQueryClient();

  const salary = Number(profile?.monthly_salary || 0);
  const monthKey = getMonthKey(new Date());

  const hasSalaryThisMonth = allTx.some(
    (t) => t.is_recurring && t.type === "income" && t.description === "Salário mensal" && getMonthKey(t.date) === monthKey
  );

  // Effect-style: trigger insert once if salary is set and not already present for the current month
  if (user && salary > 0 && !hasSalaryThisMonth) {
    const firstOfMonth = `${monthKey}-01`;
    supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        type: "income",
        description: "Salário mensal",
        amount: salary,
        category: "Salário",
        date: firstOfMonth,
        recurrence: "monthly",
        is_recurring: true,
        paid: true,
      })
      .then(({ error }) => {
        if (!error) {
          qc.invalidateQueries({ queryKey: ["transactions"] });
          toast.success("Salário mensal adicionado automaticamente!");
        }
        else console.error("Auto salary insert error:", error);
      });
  }
}
