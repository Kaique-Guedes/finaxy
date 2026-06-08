import { useTransactions, useGoals, useFinanceSummary, getMonthKey } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import MonthSelector from "@/components/MonthSelector";
import { useMonth } from "@/contexts/MonthContext";

export default function ProjectionPage() {
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const { data: goals = [] } = useGoals();
  const { monthKey, setMonthKey } = useMonth();
  const summary = useFinanceSummary(monthKey);
  const [months, setMonths] = useState(12);

  const analysis = useMemo(() => {
    try {
      // Aggregate the last 3 closed months ending at the selected month
      const [y, m] = monthKey.split("-").map(Number);
      const recentKeys: string[] = [];
      for (let i = 0; i < 3; i++) {
        const d = new Date(y, m - 1 - i, 1);
        recentKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
      }

      const monthsAgg: Record<string, { income: number; expenses: number }> = {};
      recentKeys.forEach((k) => (monthsAgg[k] = { income: 0, expenses: 0 }));
      transactions.forEach((t) => {
        if (!t || !t.date) return;
        const k = getMonthKey(t.date);
        if (!monthsAgg[k]) return;
        if (t.type === "income") monthsAgg[k].income += Number(t.amount);
        else if (t.type === "expense") monthsAgg[k].expenses += Number(t.amount);
      });

      const avgIncome =
        Object.values(monthsAgg).reduce((s, v) => s + v.income, 0) / recentKeys.length;
      const avgExpenses =
        Object.values(monthsAgg).reduce((s, v) => s + v.expenses, 0) / recentKeys.length;
      const monthlyBalance = avgIncome - avgExpenses;
      const currentBalance = summary?.available || 0;

      // Saldo Atual + (Receita Média - Gasto Médio) * N — simples e linear, sem juros
      const projectionData = Array.from({ length: months + 1 }, (_, i) => ({
        label: i === 0 ? "Hoje" : `M${i}`,
        saldo: Math.round(currentBalance + monthlyBalance * i),
      }));

      const projectedFinal = currentBalance + monthlyBalance * months;

      const goalProjections = goals
        .filter((g) => g && Number(g.saved_amount) < Number(g.target_amount))
        .map((g) => {
          const remaining = Number(g.target_amount) - Number(g.saved_amount);
          const monthsNeeded = monthlyBalance > 0 ? Math.ceil(remaining / monthlyBalance) : Infinity;
          return { name: g.name, icon: g.icon, remaining, monthsNeeded };
        });

      return { avgIncome, avgExpenses, monthlyBalance, currentBalance, projectionData, projectedFinal, goalProjections };
    } catch (err) {
      console.error("Error in ProjectionPage analysis:", err);
      return null;
    }
  }, [transactions, goals, summary, months, monthKey]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (isError || !analysis) return <div className="p-10 text-center text-muted-foreground">Ocorreu um erro ao carregar a projeção.</div>;

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-semibold text-foreground">Projeção Simples</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Fórmula: Saldo Atual + (Receita Média − Gasto Médio) × Nº de meses
        </p>
      </div>
      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <div className="px-5 mt-4 grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Saldo atual</p>
          <p className="text-lg font-semibold text-success font-mono">{formatShortCurrency(analysis.currentBalance)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Saldo médio/mês</p>
          <p className={`text-lg font-semibold font-mono ${analysis.monthlyBalance >= 0 ? "text-success" : "text-destructive"}`}>
            {analysis.monthlyBalance >= 0 ? "+" : ""}{formatShortCurrency(analysis.monthlyBalance)}
          </p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Receita média/mês</p>
          <p className="text-lg font-semibold text-foreground font-mono">{formatShortCurrency(analysis.avgIncome)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Gasto médio/mês</p>
          <p className="text-lg font-semibold text-destructive font-mono">{formatShortCurrency(analysis.avgExpenses)}</p>
        </div>
      </div>

      <div className="px-5 mb-3">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[13px] text-muted-foreground">Horizonte:</span>
          <input type="range" min={3} max={60} value={months} onChange={(e) => setMonths(parseInt(e.target.value))} className="flex-1 accent-accent" />
          <span className="text-[13px] font-semibold text-foreground min-w-[60px] text-right">{months} meses</span>
        </div>
      </div>

      <div className="mx-5 glass-card p-4 mb-5 bg-accent/5 border-accent/20">
        <p className="text-xs text-muted-foreground mb-1">Saldo projetado em {months} meses</p>
        <p className={`text-2xl font-bold font-mono ${analysis.projectedFinal >= 0 ? "text-success" : "text-destructive"}`}>
          {formatShortCurrency(analysis.projectedFinal)}
        </p>
      </div>

      <div className="mx-5 glass-card p-4 mb-5">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={analysis.projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} interval={Math.max(0, Math.floor(months / 8))} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => formatShortCurrency(value)}
            />
            <Bar dataKey="saldo" fill="#4ade80" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {analysis.goalProjections.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">🎯 Projeção de Metas</p>
          <div className="px-5 space-y-2 mb-5">
            {analysis.goalProjections.map((goal) => (
              <div key={goal.name} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{goal.icon} {goal.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Faltam {formatShortCurrency(goal.remaining)}</p>
                </div>
                <p className="text-xs font-semibold text-accent">
                  {goal.monthsNeeded === Infinity ? "∞" : `${goal.monthsNeeded}m`}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
