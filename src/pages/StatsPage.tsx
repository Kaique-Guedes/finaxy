import { useTransactions, useCategories } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const catColors: Record<string, string> = {
  Alimentação: "#f87171", Transporte: "#fb923c", Moradia: "#a78bfa",
  Saúde: "#34d399", Lazer: "#60a5fa", Educação: "#fbbf24",
  Vestuário: "#f472b6", Salário: "#4ade80", Freelance: "#38bdf8", Outros: "#94a3b8",
};

export default function StatsPage() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;
  const savingRate = income > 0 ? ((balance / income) * 100).toFixed(1) : "0";

  // Category breakdown
  const byCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });
  const totalExpense = Object.values(byCategory).reduce((a, b) => a + b, 0);
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  // Monthly data for chart
  const monthlyData = [
    { month: "Jan", receitas: 7800, gastos: 3200 },
    { month: "Fev", receitas: 8200, gastos: 3900 },
    { month: "Mar", receitas: 7500, gastos: 3100 },
    { month: "Abr", receitas: income || 8500, gastos: expense || 3680 },
  ];

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Resumo</h1>
      </div>

      {/* Summary Cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Saldo do mês</p>
          <p className="text-xl font-semibold text-success font-mono">
            {balance >= 0 ? "+" : ""}{formatShortCurrency(balance)}
          </p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Taxa de poupança</p>
          <p className="text-xl font-semibold text-accent font-mono">{savingRate}%</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">Gastos por categoria</p>
      <div className="mx-5 glass-card p-4 mb-5">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-foreground">Distribuição</span>
          <span className="text-[13px] text-muted-foreground font-mono">{formatShortCurrency(totalExpense)}</span>
        </div>
        <div className="space-y-3">
          {sortedCats.map(([cat, val]) => {
            const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="text-xs text-foreground/80 w-20 flex-none truncate">{cat}</span>
                <div className="flex-1 h-2 bg-foreground/[0.07] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: catColors[cat] || "#60a5fa" }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-16 text-right">{formatShortCurrency(val)}</span>
              </div>
            );
          })}
          {sortedCats.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem gastos registrados</p>}
        </div>
      </div>

      {/* Monthly Evolution */}
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
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] rounded-full bg-success inline-block" />Receitas</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-[3px] rounded-full bg-destructive inline-block" />Gastos</span>
        </div>
      </div>
    </div>
  );
}
