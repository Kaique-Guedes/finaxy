import { useTransactions, useCategories, useGoals } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";

export default function AlertsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: goals = [] } = useGoals();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const saving = income - expense;
  const savingRate = income > 0 ? ((saving / income) * 100).toFixed(1) : "0";

  const byCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });

  type AlertItem = { type: "danger" | "warn" | "info"; text: string; hint: string };
  const alerts: AlertItem[] = [];

  // Category limit alerts
  categories.forEach((c) => {
    const spent = byCategory[c.name] || 0;
    if (c.monthly_limit > 0 && spent > c.monthly_limit) {
      alerts.push({ type: "danger", text: `Limite de ${c.name} ultrapassado!`, hint: `Gasto ${formatShortCurrency(spent)} de ${formatShortCurrency(c.monthly_limit)} no limite` });
    } else if (c.monthly_limit > 0 && spent > c.monthly_limit * 0.8) {
      alerts.push({ type: "warn", text: `${c.name} próximo do limite`, hint: `${Math.round((spent / c.monthly_limit) * 100)}% do limite mensal usado` });
    }
  });

  // Goal risk alerts
  goals.forEach((g) => {
    const monthly = (Number(g.target_amount) - Number(g.saved_amount)) / g.months;
    if (monthly > saving) {
      alerts.push({ type: "danger", text: `Meta "${g.name}" em risco`, hint: `Precisa guardar ${formatShortCurrency(monthly)}/mês, mas poupa ${formatShortCurrency(saving)}` });
    }
  });

  // Top category
  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    const topPct = expense > 0 ? Math.round((sorted[0][1] / expense) * 100) : 0;
    alerts.push({ type: "info", text: `Dica: seus maiores gastos são em ${sorted[0][0]}`, hint: `Representa ${topPct}% dos seus gastos mensais` });
  }

  if (parseFloat(savingRate) > 20) {
    alerts.push({ type: "info", text: `Você poupou ${savingRate}% da renda esse mês!`, hint: "Acima da média recomendada de 20%" });
  }

  if (alerts.length === 0) {
    alerts.push({ type: "info", text: "Tudo sob controle! Ótimo mês 🎉", hint: "Seus gastos estão dentro dos limites" });
  }

  const typeStyles = {
    danger: { bg: "bg-destructive/[0.08]", border: "border-destructive/20", dot: "bg-destructive" },
    warn: { bg: "bg-warning/[0.08]", border: "border-warning/20", dot: "bg-warning" },
    info: { bg: "bg-accent/[0.08]", border: "border-accent/20", dot: "bg-accent" },
  };

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Alertas</h1>
      </div>
      <div className="px-5 space-y-2.5">
        {alerts.map((a, i) => {
          const s = typeStyles[a.type];
          return (
            <div key={i} className={`rounded-lg p-3.5 flex gap-3 items-start border ${s.bg} ${s.border}`}>
              <div className={`w-2 h-2 rounded-full flex-none mt-1.5 ${s.dot}`} />
              <div>
                <p className="text-[13px] text-foreground/80 leading-relaxed">{a.text}</p>
                <p className="text-xs text-muted-foreground mt-1">{a.hint}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
