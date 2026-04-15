import { useTransactions, useFinanceSummary } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const catColors: Record<string, string> = {
  Alimentação: "#f87171", Transporte: "#fb923c", Moradia: "#a78bfa",
  Saúde: "#34d399", Lazer: "#60a5fa", Educação: "#fbbf24",
  Vestuário: "#f472b6", "Renda Extra": "#4ade80", "Renda Fixa": "#38bdf8",
  "Renda Variável": "#f59e0b", Fundos: "#a78bfa", Criptomoedas: "#fb923c",
  Previdência: "#34d399", Outros: "#94a3b8",
};

export default function StatsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const summary = useFinanceSummary();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  // Category breakdown (expenses only)
  const byCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  // Investment breakdown
  const byInvestCat: Record<string, number> = {};
  transactions.filter((t) => t.type === "investment").forEach((t) => {
    byInvestCat[t.category] = (byInvestCat[t.category] || 0) + Number(t.amount);
  });
  const sortedInvestCats = Object.entries(byInvestCat).sort((a, b) => b[1] - a[1]);

  // Monthly data grouped from transactions
  const monthMap: Record<string, { receitas: number; gastos: number; investimentos: number }> = {};
  transactions.forEach((t) => {
    const m = t.date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { receitas: 0, gastos: 0, investimentos: 0 };
    if (t.type === "income") monthMap[m].receitas += Number(t.amount);
    else if (t.type === "expense") monthMap[m].gastos += Number(t.amount);
    else if (t.type === "investment") monthMap[m].investimentos += Number(t.amount);
  });
  if (summary.salary > 0) {
    Object.keys(monthMap).forEach((m) => { monthMap[m].receitas += summary.salary; });
  }
  const monthlyData = Object.entries(monthMap)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .map(([m, v]) => ({
      month: new Date(m + "-15").toLocaleDateString("pt-BR", { month: "short" }),
      ...v,
    }));

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Resumo</h1>
      </div>

      {/* Summary Cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Saldo disponível</p>
          <p className="text-xl font-semibold text-success font-mono">
            {summary.available >= 0 ? "+" : ""}{formatShortCurrency(summary.available)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Total investido</p>
          <p className="text-xl font-semibold text-accent font-mono">{formatShortCurrency(summary.investments)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Total gastos</p>
          <p className="text-xl font-semibold text-destructive font-mono">{formatShortCurrency(summary.totalExpenses)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Gastos fixos</p>
          <p className="text-xl font-semibold text-foreground font-mono">{formatShortCurrency(summary.fixedExpenses)}</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">Gastos por categoria</p>
      <div className="mx-5 glass-card p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-foreground">Distribuição</span>
          <span className="text-[13px] text-muted-foreground font-mono">{formatShortCurrency(summary.totalExpenses)}</span>
        </div>
        <div className="space-y-3">
          {sortedCats.map(([cat, val]) => {
            const pct = summary.totalExpenses > 0 ? Math.round((val / summary.totalExpenses) * 100) : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-foreground/80 w-20 flex-none truncate">{cat}</span>
                <div className="flex-1 h-2 bg-foreground/[0.07] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: catColors[cat] || "#60a5fa" }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-16 text-right">{formatShortCurrency(val)}</span>
              </div>
            );
          })}
          {sortedCats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem gastos registrados</p>}
        </div>
      </div>

      {/* Investment Breakdown */}
      {sortedInvestCats.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">Investimentos por categoria</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <div className="space-y-3">
              {sortedInvestCats.map(([cat, val]) => {
                const pct = summary.investments > 0 ? Math.round((val / summary.investments) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-foreground/80 w-24 flex-none truncate">{cat}</span>
                    <div className="flex-1 h-2 bg-foreground/[0.07] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: catColors[cat] || "#38bdf8" }} />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-16 text-right">{formatShortCurrency(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Monthly Evolution */}
      {monthlyData.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">Evolução mensal</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="receitas" stroke="#4ade80" strokeWidth={2} dot={{ fill: "#4ade80", r: 4 }} />
                <Line type="monotone" dataKey="gastos" stroke="#f87171" strokeWidth={2} dot={{ fill: "#f87171", r: 4 }} />
                <Line type="monotone" dataKey="investimentos" stroke="#38bdf8" strokeWidth={2} dot={{ fill: "#38bdf8", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] rounded-full bg-success inline-block" />Receitas</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] rounded-full bg-destructive inline-block" />Gastos</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] rounded-full bg-accent inline-block" />Investimentos</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
