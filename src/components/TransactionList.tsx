import { useState } from "react";
import { formatShortCurrency, formatDate } from "@/lib/format";
import { Transaction } from "@/hooks/useFinanceData";
import { Trash2 } from "lucide-react";

const catColors: Record<string, string> = {
  Alimentação: "#f87171", Transporte: "#fb923c", Moradia: "#a78bfa",
  Saúde: "#34d399", Lazer: "#60a5fa", Educação: "#fbbf24",
  Vestuário: "#f472b6", Salário: "#4ade80", Freelance: "#38bdf8", Outros: "#94a3b8",
};

const catIcons: Record<string, string> = {
  Alimentação: "🍔", Transporte: "🚗", Moradia: "🏠",
  Saúde: "💊", Lazer: "🎮", Educação: "📚",
  Vestuário: "👔", Salário: "💼", Freelance: "💡", Outros: "💰",
};

const recurrenceLabels: Record<string, string> = {
  monthly: "Mensal", variable: "Variável", once: "Único",
};

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  return (
    <div>
      <div className="flex justify-between items-center px-5 mt-6 mb-3">
        <span className="text-sm font-semibold text-foreground/80">Transações</span>
        <div className="flex gap-1">
          {(["all", "expense", "income"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                filter === f
                  ? "bg-secondary text-foreground border border-primary/30"
                  : "text-muted-foreground"
              }`}
            >
              {f === "all" ? "Todas" : f === "expense" ? "Gastos" : "Receitas"}
            </button>
          ))}
        </div>
      </div>
      <div className="px-5 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada</p>
        )}
        {filtered.map((t) => (
          <div
            key={t.id}
            className="glass-card flex items-center gap-3.5 p-3.5 group"
          >
            <div
              className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg flex-none"
              style={{ background: (catColors[t.category] || "#64748b") + "22" }}
            >
              {catIcons[t.category] || "💰"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.category} · {recurrenceLabels[t.recurrence] || t.recurrence}
              </p>
            </div>
            <div className="text-right flex-none">
              <p className={`text-sm font-semibold font-mono ${t.type === "expense" ? "text-destructive" : "text-success"}`}>
                {t.type === "expense" ? "-" : "+"} {formatShortCurrency(Number(t.amount))}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
            </div>
            {onDelete && (
              <button
                onClick={() => onDelete(t.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
