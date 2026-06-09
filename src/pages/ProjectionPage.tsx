import { useTransactions } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ProjectionPage() {
  const { data: transactions = [], isLoading, isError } = useTransactions();
  const [monthlyAmount, setMonthlyAmount] = useState<number>(500);
  const [months, setMonths] = useState<number>(12);

  const investmentsByCategory = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.type === "investment") {
        map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
      }
    });
    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalInvested = investmentsByCategory.reduce((s, c) => s + c.total, 0);

  const projectionData = useMemo(
    () =>
      Array.from({ length: months + 1 }, (_, i) => ({
        label: i === 0 ? "Hoje" : `M${i}`,
        guardado: Math.round(monthlyAmount * i),
      })),
    [months, monthlyAmount]
  );

  const projectedTotal = monthlyAmount * months;

  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  if (isError)
    return <div className="p-10 text-center text-muted-foreground">Ocorreu um erro ao carregar.</div>;

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-2">
        <h1 className="text-xl font-semibold text-foreground">Projeção Manual</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Defina quanto pretende guardar por mês — sem juros, cálculo linear.
        </p>
      </div>

      {/* Investido por categoria */}
      <div className="px-5 mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-foreground/80">💼 Investido por categoria</p>
          <p className="text-xs text-muted-foreground font-mono">
            Total: <span className="text-accent font-semibold">{formatShortCurrency(totalInvested)}</span>
          </p>
        </div>
        {investmentsByCategory.length === 0 ? (
          <div className="glass-card p-4 text-center text-xs text-muted-foreground">
            Nenhum investimento registrado ainda.
          </div>
        ) : (
          <div className="space-y-2 mb-5">
            {investmentsByCategory.map((c) => {
              const pct = totalInvested > 0 ? (c.total / totalInvested) * 100 : 0;
              return (
                <div key={c.category} className="glass-card p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-foreground">{c.category}</p>
                    <p className="text-sm font-semibold text-accent font-mono">
                      {formatShortCurrency(c.total)}
                    </p>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projeção manual */}
      <div className="px-5 mt-2">
        <p className="text-sm font-semibold text-foreground/80 mb-3">📈 Simulador de Poupança</p>

        <div className="glass-card p-4 mb-3">
          <label className="text-[11px] text-muted-foreground mb-1.5 block">
            Quanto pretendo guardar por mês
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">R$</span>
            <input
              type="number"
              min={0}
              step={50}
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Math.max(0, Number(e.target.value)))}
              className="flex-1 bg-secondary/40 border border-border rounded-lg px-3 py-2 text-base font-semibold text-foreground font-mono focus:outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="glass-card p-4 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">Período:</span>
            <input
              type="range"
              min={1}
              max={60}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="flex-1 accent-accent"
            />
            <span className="text-[13px] font-semibold text-foreground min-w-[64px] text-right">
              {months} {months === 1 ? "mês" : "meses"}
            </span>
          </div>
        </div>

        <div className="glass-card p-4 mb-5 bg-accent/5 border-accent/20">
          <p className="text-xs text-muted-foreground mb-1">
            Total guardado em {months} {months === 1 ? "mês" : "meses"}
          </p>
          <p className="text-2xl font-bold font-mono text-success">
            {formatShortCurrency(projectedTotal)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {formatShortCurrency(monthlyAmount)} × {months} (sem juros)
          </p>
        </div>

        <div className="glass-card p-4 mb-5">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 10 }}
                interval={Math.max(0, Math.floor(months / 8))}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d1526",
                  border: "1px solid #162240",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number) => formatShortCurrency(value)}
              />
              <Bar dataKey="guardado" fill="#4ade80" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
