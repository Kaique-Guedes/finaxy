import { useTransactions, useFinanceSummary, getMonthKey } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import MonthSelector from "@/components/MonthSelector";
import { useMonth } from "@/contexts/MonthContext";

const catColors: Record<string, string> = {
  Alimentação: "#f87171", Transporte: "#fb923c", Moradia: "#a78bfa",
  Saúde: "#34d399", Lazer: "#60a5fa", Educação: "#fbbf24",
  Vestuário: "#f472b6", "Renda Extra": "#4ade80",
  "Reserva de Emergência": "#10b981", "Investimentos Futuros": "#8b5cf6",
  "Renda Fixa": "#38bdf8", "Renda Variável": "#f59e0b",
  Fundos: "#a78bfa", Criptomoedas: "#fb923c",
  Previdência: "#34d399", Outros: "#94a3b8",
};

type PeriodType = "month" | "quarter" | "semester" | "year";
const labels: Record<PeriodType, string> = { month: "Mês", quarter: "Trimestre", semester: "Semestre", year: "Ano" };

// Build the list of YYYY-MM keys covered by the period anchored at the selected month
function getPeriodMonthKeys(anchor: string, period: PeriodType): string[] {
  const [y, m] = anchor.split("-").map(Number);
  if (period === "month") return [anchor];
  if (period === "year") {
    return Array.from({ length: 12 }, (_, i) =>
      `${y}-${String(i + 1).padStart(2, "0")}`
    );
  }
  const span = period === "quarter" ? 3 : 6;
  const keys: string[] = [];
  for (let i = span - 1; i >= 0; i--) {
    const d = new Date(y, m - 1 - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export default function StatsPage() {
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const { monthKey, setMonthKey } = useMonth();
  const summary = useFinanceSummary(monthKey);
  const [period, setPeriod] = useState<PeriodType>("month");

  const analysis = useMemo(() => {
    try {
      const periodKeys = new Set(getPeriodMonthKeys(monthKey, period));
      const filtered = transactions.filter((t) => t && t.date && periodKeys.has(getMonthKey(t.date)));

      const byCategory: Record<string, number> = {};
      filtered.filter((t) => t.type === "expense").forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
      });
      const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

      const byInvest: Record<string, number> = {};
      filtered.filter((t) => t.type === "investment").forEach((t) => {
        byInvest[t.category] = (byInvest[t.category] || 0) + Number(t.amount);
      });
      const sortedInvest = Object.entries(byInvest).sort((a, b) => b[1] - a[1]);

      const totalExpenses = Object.values(byCategory).reduce((a, b) => a + b, 0);
      const totalInvestments = Object.values(byInvest).reduce((a, b) => a + b, 0);
      const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const fixedExpenses = filtered.filter((t) => t.type === "expense" && t.recurrence === "monthly").reduce((s, t) => s + Number(t.amount), 0);

      const chartData = sortedCats.slice(0, 8).map(([name, value]) => ({
        name,
        value: Math.round(value),
        color: catColors[name] || "#60a5fa",
      }));

      return { sortedCats, sortedInvest, totalExpenses, totalInvestments, totalIncome, fixedExpenses, chartData };
    } catch (err) {
      console.error("Error in StatsPage analysis:", err);
      return null;
    }
  }, [transactions, monthKey, period]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (isError || !analysis) return <div className="p-10 text-center text-muted-foreground">Ocorreu um erro ao carregar as estatísticas.</div>;

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-semibold text-foreground">Resumo</h1>
      </div>
      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />

      <div className="px-5 mt-4 mb-5 flex gap-2">
        {(["month", "quarter", "semester", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              period === p ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
            }`}
          >
            {labels[p]}
          </button>
        ))}
      </div>

      <div className="px-5 grid grid-cols-2 gap-3 mb-5">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Receitas</p>
          <p className="text-xl font-semibold text-success font-mono">{formatShortCurrency(analysis.totalIncome)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Gastos</p>
          <p className="text-xl font-semibold text-destructive font-mono">{formatShortCurrency(analysis.totalExpenses)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Investimentos</p>
          <p className="text-xl font-semibold text-accent font-mono">{formatShortCurrency(analysis.totalInvestments)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground mb-1.5">Gastos Fixos</p>
          <p className="text-xl font-semibold text-foreground font-mono">{formatShortCurrency(analysis.fixedExpenses)}</p>
        </div>
      </div>

      <div className="px-5 mb-5">
        <div className="glass-card p-4 bg-success/5 border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Saldo do período</p>
          <p className="text-2xl font-bold text-success font-mono">
            {formatShortCurrency(analysis.totalIncome - analysis.totalExpenses - analysis.totalInvestments)}
          </p>
        </div>
      </div>

      {analysis.chartData.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">💰 Gastos por Categoria</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <ResponsiveContainer width="100%" height={Math.max(160, analysis.chartData.length * 32)}>
              <BarChart data={analysis.chartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => formatShortCurrency(value)}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {analysis.chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {analysis.sortedInvest.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">📈 Investimentos</p>
          <div className="mx-5 glass-card p-4 mb-5 space-y-3">
            {analysis.sortedInvest.map(([cat, val]) => {
              const pct = analysis.totalInvestments > 0 ? Math.round((val / analysis.totalInvestments) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-foreground/80 w-24 flex-none truncate">{cat}</span>
                  <div className="flex-1 h-2 bg-foreground/[0.07] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: catColors[cat] || "#38bdf8" }} />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-16 text-right">{formatShortCurrency(val)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
