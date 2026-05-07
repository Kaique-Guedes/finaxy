import { useTransactions, useFinanceSummary } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

function getPeriodLabel(period: PeriodType): string {
  const labels: Record<PeriodType, string> = {
    month: "Mês",
    quarter: "Trimestre",
    semester: "Semestre",
    year: "Ano",
  };
  return labels[period];
}

export default function StatsPage() {
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const summary = useFinanceSummary();
  const [period, setPeriod] = useState<PeriodType>("month");

  const analysis = useMemo(() => {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Determinar o intervalo de datas baseado no período
      let startDate: Date;
      let endDate = new Date(now);

      if (period === "month") {
        startDate = new Date(currentYear, currentMonth, 1);
      } else if (period === "quarter") {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        startDate = new Date(currentYear, quarterStart, 1);
      } else if (period === "semester") {
        const semesterStart = currentMonth >= 6 ? 6 : 0;
        startDate = new Date(currentYear, semesterStart, 1);
      } else {
        // year
        startDate = new Date(currentYear, 0, 1);
      }

      const startStr = startDate.toISOString().slice(0, 10);
      const endStr = endDate.toISOString().slice(0, 10);

      // Filtrar transações dentro do período
      const filteredTxs = transactions.filter((t) => t && t.date && t.date >= startStr && t.date <= endStr);

      // Agrupar por categoria (gastos)
      const byCategory: Record<string, number> = {};
      filteredTxs.filter((t) => t.type === "expense").forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
      });
      const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

      // Agrupar por categoria (investimentos)
      const byInvestCat: Record<string, number> = {};
      filteredTxs.filter((t) => t.type === "investment").forEach((t) => {
        byInvestCat[t.category] = (byInvestCat[t.category] || 0) + Number(t.amount);
      });
      const sortedInvestCats = Object.entries(byInvestCat).sort((a, b) => b[1] - a[1]);

      // Calcular totais
      const totalExpenses = Object.values(byCategory).reduce((a, b) => a + b, 0);
      const totalInvestments = Object.values(byInvestCat).reduce((a, b) => a + b, 0);
      const totalIncome = filteredTxs.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      const fixedExpenses = filteredTxs.filter((t) => t.type === "expense" && t.recurrence === "monthly").reduce((s, t) => s + Number(t.amount), 0);

      // Dados mensais para gráfico (últimos 6 meses)
      const monthMap: Record<string, { receitas: number; gastos: number; investimentos: number }> = {};
      transactions.forEach((t) => {
        if (!t || !t.date) return;
        const m = t.date.slice(0, 7);
        if (!monthMap[m]) monthMap[m] = { receitas: 0, gastos: 0, investimentos: 0 };
        if (t.type === "income") monthMap[m].receitas += Number(t.amount);
        else if (t.type === "expense") monthMap[m].gastos += Number(t.amount);
        else if (t.type === "investment") monthMap[m].investimentos += Number(t.amount);
      });

      // Adicionar salário aos meses
      const salary = Number(summary?.salary || 0);
      if (salary > 0) {
        Object.keys(monthMap).forEach((m) => { monthMap[m].receitas += salary; });
      }

      const monthlyData = Object.entries(monthMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([m, v]) => ({
          month: new Date(m + "-15").toLocaleDateString("pt-BR", { month: "short" }),
          ...v,
        }));

      return {
        sortedCats,
        sortedInvestCats,
        totalExpenses,
        totalInvestments,
        totalIncome,
        fixedExpenses,
        monthlyData,
        periodLabel: getPeriodLabel(period),
      };
    } catch (err) {
      console.error("Error in StatsPage analysis:", err);
      return null;
    }
  }, [transactions, summary, period]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (isError || !analysis) return <div className="p-10 text-center text-muted-foreground">Ocorreu um erro ao carregar as estatísticas.</div>;

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Resumo</h1>
      </div>

      {/* Filtro de Período */}
      <div className="px-5 mb-5 flex gap-2">
        {(["month", "quarter", "semester", "year"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground border border-border hover:bg-secondary/80"
            }`}
          >
            {getPeriodLabel(p)}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
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

      {/* Saldo */}
      <div className="px-5 mb-5">
        <div className="glass-card p-4 bg-success/5 border-success/20">
          <p className="text-sm text-muted-foreground mb-1">Saldo do período</p>
          <p className="text-2xl font-bold text-success font-mono">
            {formatShortCurrency(analysis.totalIncome - analysis.totalExpenses - analysis.totalInvestments)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {analysis.sortedCats.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">💰 Gastos por Categoria</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-foreground">Distribuição</span>
              <span className="text-[13px] text-muted-foreground font-mono">{formatShortCurrency(analysis.totalExpenses)}</span>
            </div>
            <div className="space-y-3">
              {analysis.sortedCats.map(([cat, val]) => {
                const pct = analysis.totalExpenses > 0 ? Math.round((val / analysis.totalExpenses) * 100) : 0;
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
            </div>
          </div>
        </>
      )}

      {/* Investment Breakdown */}
      {analysis.sortedInvestCats.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">📈 Investimentos por Categoria</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <div className="space-y-3">
              {analysis.sortedInvestCats.map(([cat, val]) => {
                const pct = analysis.totalInvestments > 0 ? Math.round((val / analysis.totalInvestments) * 100) : 0;
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
      {analysis.monthlyData.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">📊 Evolução Mensal</p>
          <div className="mx-5 glass-card p-4 mb-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={analysis.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }}
                  formatter={(value: number) => formatShortCurrency(value)}
                />
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
