import { useTransactions, useGoals, useFinanceSummary } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, Line, LineChart } from "recharts";

export default function ProjectionPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: goals = [] } = useGoals();
  const summary = useFinanceSummary();
  const [months, setMonths] = useState(12);

  const analysis = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Group transactions by month
    const byMonth: Record<string, { expenses: number; investments: number; income: number; byCategory: Record<string, number> }> = {};
    transactions.forEach((t) => {
      const m = t.date.slice(0, 7);
      if (!byMonth[m]) byMonth[m] = { expenses: 0, investments: 0, income: 0, byCategory: {} };
      if (t.type === "expense") {
        byMonth[m].expenses += Number(t.amount);
        byMonth[m].byCategory[t.category] = (byMonth[m].byCategory[t.category] || 0) + Number(t.amount);
      }
      if (t.type === "investment") byMonth[m].investments += Number(t.amount);
      if (t.type === "income") byMonth[m].income += Number(t.amount);
    });

    const sortedMonths = Object.keys(byMonth).sort().reverse();
    const last3 = sortedMonths.slice(0, 3);
    const last6 = sortedMonths.slice(0, 6);

    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const currentMonthData = byMonth[currentMonth] || { expenses: 0, investments: 0, income: 0, byCategory: {} };
    const avg3Expenses = avg(last3.map((m) => byMonth[m].expenses));
    const avg6Expenses = avg(last6.map((m) => byMonth[m].expenses));
    const avg3Investments = avg(last3.map((m) => byMonth[m].investments));
    const totalInvestedAll = transactions.filter(t => t.type === "investment").reduce((s, t) => s + Number(t.amount), 0);
    const investPct = summary.totalIncome > 0 ? (summary.investments / summary.totalIncome * 100) : 0;

    // Top 3 categories
    const allCatTotals: Record<string, number> = {};
    const prevMonthCatTotals: Record<string, number> = {};
    transactions.filter(t => t.type === "expense").forEach((t) => {
      allCatTotals[t.category] = (allCatTotals[t.category] || 0) + Number(t.amount);
    });
    const prevMonth = sortedMonths.find(m => m !== currentMonth);
    if (prevMonth && byMonth[prevMonth]) {
      Object.entries(byMonth[prevMonth].byCategory).forEach(([cat, val]) => {
        prevMonthCatTotals[cat] = val;
      });
    }

    const topCategories = Object.entries(currentMonthData.byCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, val]) => {
        const prev = prevMonthCatTotals[cat] || 0;
        const growth = prev > 0 ? ((val - prev) / prev) * 100 : 0;
        return { cat, val, growth };
      });

    // Insights
    const insights: string[] = [];
    topCategories.forEach(({ cat, growth }) => {
      if (growth > 20) insights.push(`Seus gastos com ${cat} aumentaram ${growth.toFixed(0)}% este mês`);
    });
    
    // Investment breakdown by category
    const investByCategory: Record<string, number> = {};
    transactions.filter(t => t.type === "investment").forEach(t => {
      investByCategory[t.category] = (investByCategory[t.category] || 0) + Number(t.amount);
    });
    const sortedInvestments = Object.entries(investByCategory).sort((a, b) => b[1] - a[1]);
    if (avg3Investments > 0 && summary.investments < avg3Investments * 0.8) {
      insights.push("Você investiu menos do que a média dos últimos 3 meses");
    }
    if (summary.available > summary.totalIncome * 0.3) {
      insights.push("Ótimo! Você está com mais de 30% da renda disponível");
    }

    // Projections
    const monthlySaving = summary.totalIncome - avg3Expenses - avg3Investments;
    const monthlyRate = 0.008; // 0.8% a.m.

    const projectionData = Array.from({ length: months + 1 }, (_, i) => {
      const projSaldo = monthlySaving * i;
      const projInvestFV = avg3Investments > 0
        ? avg3Investments * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate)
        : 0;
      const projInvest10 = (avg3Investments * 1.1) > 0
        ? (avg3Investments * 1.1) * ((Math.pow(1 + monthlyRate, i) - 1) / monthlyRate)
        : 0;
      return {
        label: i === 0 ? "Hoje" : `M${i}`,
        patrimonio: Math.round(totalInvestedAll + projInvestFV + projSaldo),
        patrimonio10: Math.round(totalInvestedAll + projInvest10 + projSaldo),
      };
    });

    // Goal projections
    const goalProjections = goals
      .filter(g => Number(g.saved_amount) < Number(g.target_amount))
      .map((g) => {
        const remaining = Number(g.target_amount) - Number(g.saved_amount);
        const monthlyForGoal = remaining / g.months;
        const monthsNeeded = monthlySaving > 0 ? Math.ceil(remaining / monthlySaving) : Infinity;
        return { name: g.name, icon: g.icon, remaining, monthlyForGoal, monthsNeeded };
      });

    return {
      currentMonthData,
      avg3Expenses, avg6Expenses, avg3Investments,
      totalInvestedAll, investPct,
      topCategories, insights,
      projectionData, goalProjections, monthlySaving,
      sortedInvestments,
    };
  }, [transactions, goals, summary, months]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Projeção Financeira</h1>
      </div>

      {/* Summary panel */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Gasto este mês</p>
          <p className="text-lg font-semibold text-destructive font-mono">{formatShortCurrency(analysis.currentMonthData.expenses)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Média 3 meses</p>
          <p className="text-lg font-semibold text-foreground font-mono">{formatShortCurrency(analysis.avg3Expenses)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Investido este mês</p>
          <p className="text-lg font-semibold text-accent font-mono">{formatShortCurrency(summary.investments)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Total investido</p>
          <p className="text-lg font-semibold text-accent font-mono">{formatShortCurrency(analysis.totalInvestedAll)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">Saldo disponível</p>
          <p className="text-lg font-semibold text-success font-mono">{formatShortCurrency(summary.available)}</p>
        </div>
        <div className="glass-card p-3.5">
          <p className="text-[11px] text-muted-foreground mb-1">% Renda → Invest.</p>
          <p className="text-lg font-semibold text-accent font-mono">{analysis.investPct.toFixed(1)}%</p>
        </div>
      </div>

      {/* Investment Breakdown */}
      {analysis.sortedInvestments.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">💼 Detalhamento de Patrimônio</p>
          <div className="px-5 space-y-2 mb-5">
            <div className="glass-card p-4 mb-2 bg-accent/5 border-accent/20">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-foreground">Patrimônio Total</p>
                <p className="text-lg font-bold text-accent font-mono">{formatShortCurrency(summary.available + summary.investments)}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Soma do saldo disponível e todos os investimentos</p>
            </div>
            {analysis.sortedInvestments.map(([cat, val]) => (
              <div key={cat} className="glass-card flex items-center gap-3 p-3.5">
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{cat}</p>
                  <p className="text-xs text-muted-foreground">{((val / analysis.totalInvestedAll) * 100).toFixed(1)}% da carteira</p>
                </div>
                <p className="text-sm font-semibold text-accent font-mono">{formatShortCurrency(val)}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Where to improve */}
      {analysis.topCategories.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">📊 Onde melhorar (Gastos)</p>
          <div className="px-5 space-y-2 mb-5">
            {analysis.topCategories.map(({ cat, val, growth }) => (
              <div key={cat} className={`glass-card flex items-center gap-3 p-3.5 ${growth > 20 ? "ring-1 ring-warning/40" : ""}`}>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{cat}</p>
                  <p className="text-xs text-muted-foreground">{formatShortCurrency(val)} este mês</p>
                </div>
                {growth > 20 && (
                  <span className="text-[11px] font-semibold bg-warning/15 text-warning px-2 py-1 rounded-md">
                    ↑ {growth.toFixed(0)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Insights */}
      {analysis.insights.length > 0 && (
        <div className="px-5 mb-5">
          <div className="glass-card p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground mb-2">💡 Insights</p>
            {analysis.insights.map((text, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {text}</p>
            ))}
          </div>
        </div>
      )}

      {/* Projection chart */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-semibold text-foreground/80">📈 Projeção de patrimônio</span>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[13px] text-muted-foreground">Horizonte:</span>
          <input type="range" min={3} max={60} value={months} onChange={(e) => setMonths(parseInt(e.target.value))} className="flex-1 accent-accent" />
          <span className="text-[13px] font-semibold text-foreground min-w-[60px] text-right">{months} meses</span>
        </div>
      </div>

      <div className="mx-5 glass-card p-4 mb-5">
        <p className="text-[11px] text-muted-foreground mb-1">Patrimônio = saldo disponível + carteira de investimentos</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={analysis.projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} interval={Math.floor(months / 6)} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }} />
            <Line type="monotone" dataKey="patrimonio" stroke="#4ade80" strokeWidth={2} dot={false} name="Atual" />
            <Line type="monotone" dataKey="patrimonio10" stroke="#a78bfa" strokeWidth={2} dot={false} strokeDasharray="5 5" name="+10% aportes" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-success inline-block" />Se continuar assim</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-[2px] bg-[#a78bfa] inline-block" style={{ borderTop: "2px dashed #a78bfa", height: 0 }} />+10% aportes</span>
        </div>
      </div>

      {/* Scenarios */}
      <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">🎯 Projeção por período</p>
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        {[3, 6, 12, 24].map((m) => {
          const monthlyRate = 0.008;
          const investFV = analysis.avg3Investments > 0
            ? analysis.avg3Investments * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate)
            : 0;
          const total = analysis.totalInvestedAll + investFV + (analysis.monthlySaving * m);
          return (
            <div key={m} className="glass-card p-3.5">
              <p className="text-[11px] text-muted-foreground">{m} meses</p>
              <p className="text-sm font-semibold text-foreground font-mono mt-1">{formatShortCurrency(total)}</p>
            </div>
          );
        })}
      </div>

      {/* Goal projections */}
      {analysis.goalProjections.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">🏁 Previsão de metas</p>
          <div className="px-5 space-y-2.5 mb-5">
            {analysis.goalProjections.map((g) => (
              <div key={g.name} className="glass-card flex items-center gap-3 p-3.5">
                <span className="text-lg">{g.icon}</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-foreground">{g.name}</p>
                  <p className="text-xs text-muted-foreground">Faltam {formatShortCurrency(g.remaining)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-semibold text-accent font-mono">
                    {g.monthsNeeded === Infinity ? "—" : `~${g.monthsNeeded} meses`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
