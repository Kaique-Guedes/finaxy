import { useFinanceSummary } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";

export default function ProjectionPage() {
  const summary = useFinanceSummary();
  const [months, setMonths] = useState(12);

  const monthlySaving = summary.available;

  const projData = Array.from({ length: months + 1 }, (_, i) => ({
    label: i === 0 ? "Hoje" : `M${i}`,
    saldo: Math.round(monthlySaving * (i + 1)),
  }));

  const scenarios = [
    { label: "Conservador (-10% renda)", saving: monthlySaving * 0.9, icon: "🛡", col: "#60a5fa" },
    { label: "Atual (comportamento atual)", saving: monthlySaving, icon: "📊", col: "#4ade80" },
    { label: "Otimizado (-15% gastos)", saving: monthlySaving + summary.totalExpenses * 0.15, icon: "🚀", col: "#a78bfa" },
  ];

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-xl font-semibold text-foreground">Projeção</h1>
      </div>

      <div className="mx-5 glass-card p-4 mb-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Poupança mensal</p>
            <p className="text-xl font-semibold text-success font-mono">{formatShortCurrency(monthlySaving)}</p>
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">Em {months} meses</p>
            <p className="text-xl font-semibold text-accent font-mono">{formatShortCurrency(monthlySaving * months)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <span className="text-[13px] text-muted-foreground">Horizonte:</span>
          <input type="range" min={1} max={36} value={months} onChange={(e) => setMonths(parseInt(e.target.value))} className="flex-1 accent-accent" />
          <span className="text-[13px] font-semibold text-foreground min-w-[50px] text-right">{months} meses</span>
        </div>
      </div>

      <div className="mx-5 glass-card p-4 mb-5">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={projData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 10 }} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #162240", borderRadius: 8, fontSize: 12 }} />
            <Area type="monotone" dataKey="saldo" stroke="#38bdf8" fill="rgba(56,189,248,0.07)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm font-semibold text-foreground/80 px-5 mb-3">Cenários</p>
      <div className="px-5 space-y-2.5">
        {scenarios.map((s) => (
          <div key={s.label} className="glass-card flex items-center gap-3.5 p-4">
            <span className="text-[22px]">{s.icon}</span>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formatShortCurrency(s.saving)}/mês poupados</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono" style={{ color: s.col }}>{formatShortCurrency(s.saving * 12)}</p>
              <p className="text-[11px] text-muted-foreground">em 12 meses</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
