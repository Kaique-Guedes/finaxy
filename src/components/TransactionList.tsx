import { useState } from "react";
import { formatShortCurrency, formatDate } from "@/lib/format";
import { Transaction, useUpdateTransaction } from "@/hooks/useFinanceData";
import { Trash2, Check, Repeat } from "lucide-react";

const catColors: Record<string, string> = {
  Alimentação: "#f87171", Transporte: "#fb923c", Moradia: "#a78bfa",
  Saúde: "#34d399", Lazer: "#60a5fa", Educação: "#fbbf24",
  Vestuário: "#f472b6", "Renda Extra": "#4ade80", Salário: "#22c55e",
  "Reserva de Emergência": "#10b981", "Investimentos Futuros": "#8b5cf6",
  "Renda Fixa": "#38bdf8", "Renda Variável": "#f59e0b",
  Fundos: "#a78bfa", Criptomoedas: "#fb923c", Previdência: "#34d399",
  Outros: "#94a3b8",
};

const catIcons: Record<string, string> = {
  Alimentação: "🍔", Transporte: "🚗", Moradia: "🏠",
  Saúde: "💊", Lazer: "🎮", Educação: "📚",
  Vestuário: "👔", "Renda Extra": "💰", Salário: "💼",
  "Reserva de Emergência": "🛡️", "Investimentos Futuros": "🚀",
  "Renda Fixa": "🏦", "Renda Variável": "📊",
  Fundos: "💼", Criptomoedas: "₿", Previdência: "🛡",
  Outros: "💰",
};

const recurrenceLabels: Record<string, string> = {
  monthly: "Fixo", variable: "Variável", once: "Único",
};

const typeLabels: Record<string, string> = {
  expense: "Gasto", income: "Renda Extra", investment: "Investimento",
};

type TypeFilter = "all" | "income" | "expense" | "investment";
type PaidFilter = "all" | "paid" | "pending";

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
}

export default function TransactionList({ transactions, onDelete }: Props) {
  const [filter, setFilter] = useState<TypeFilter>("all");
  const [paidFilter, setPaidFilter] = useState<PaidFilter>("all");
  const updateTx = useUpdateTransaction();

  const filtered = transactions.filter((t) => {
    if (filter !== "all" && t.type !== filter) return false;
    if (paidFilter !== "all" && t.type === "expense") {
      if (paidFilter === "paid" && !t.paid) return false;
      if (paidFilter === "pending" && t.paid) return false;
    }
    return true;
  });

  const expenses = transactions.filter((t) => t.type === "expense");
  const totalPaid = expenses.filter((t) => t.paid).reduce((s, t) => s + Number(t.amount), 0);
  const totalPending = expenses.filter((t) => !t.paid).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div>
      {expenses.length > 0 && (
        <div className="mx-5 mt-5 flex gap-2.5">
          <div className="flex-1 glass-card p-3">
            <p className="text-[11px] text-muted-foreground">✓ Pago no mês</p>
            <p className="text-sm font-semibold font-mono text-success mt-0.5">{formatShortCurrency(totalPaid)}</p>
          </div>
          <div className="flex-1 glass-card p-3">
            <p className="text-[11px] text-muted-foreground">⏳ Pendente</p>
            <p className="text-sm font-semibold font-mono text-destructive mt-0.5">{formatShortCurrency(totalPending)}</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-5 mt-6 mb-3 flex-wrap gap-2">
        <span className="text-sm font-semibold text-foreground/80">Transações</span>
        <div className="flex gap-1">
          {(["all", "expense", "income", "investment"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-colors ${
                filter === f ? "bg-secondary text-foreground border border-primary/30" : "text-muted-foreground"
              }`}
            >
              {f === "all" ? "Todas" : f === "expense" ? "Gastos" : f === "income" ? "Renda" : "Invest."}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 flex gap-1 mb-3">
        {(["all", "pending", "paid"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPaidFilter(p)}
            className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
              paidFilter === p ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground border border-border"
            }`}
          >
            {p === "all" ? "Todos" : p === "paid" ? "✓ Pagos" : "⏳ Pendentes"}
          </button>
        ))}
      </div>

      <div className="px-5 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação encontrada</p>
        )}
        {filtered.map((t) => {
          const isGoalContrib = t.category.startsWith("Aporte:");
          const isExpense = t.type === "expense";
          const isPaid = t.paid;
          return (
            <div key={t.id} className={`glass-card flex items-center gap-3 p-3.5 group transition-opacity ${isExpense && isPaid ? "opacity-60" : ""}`}>
              {isExpense && (
                <button
                  onClick={() => updateTx.mutate({ id: t.id, paid: !isPaid })}
                  className={`w-6 h-6 rounded-md border-2 flex-none flex items-center justify-center transition-colors ${
                    isPaid ? "bg-success border-success text-white" : "border-border bg-transparent"
                  }`}
                  aria-label={isPaid ? "Marcar como pendente" : "Marcar como pago"}
                >
                  {isPaid && <Check className="w-3.5 h-3.5" />}
                </button>
              )}
              <div
                className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-lg flex-none"
                style={{ background: (catColors[t.category] || (isGoalContrib ? "#3b82f6" : "#64748b")) + "22" }}
              >
                {isGoalContrib ? "🎯" : catIcons[t.category] || "💰"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium text-foreground truncate ${isExpense && isPaid ? "line-through" : ""}`}>{t.description}</p>
                  {t.is_recurring && (
                    <span title="Recorrente" className="flex-none inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      <Repeat className="w-2.5 h-2.5" /> Auto
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.category} · {t.type === "expense" ? recurrenceLabels[t.recurrence] || t.recurrence : typeLabels[t.type]}
                  {isExpense && (isPaid ? " · ✓ Pago" : " · ⏳ Pendente")}
                </p>
              </div>
              <div className="text-right flex-none">
                <p className={`text-sm font-semibold font-mono ${
                  t.type === "expense" ? "text-destructive" : t.type === "investment" ? "text-accent" : "text-success"
                }`}>
                  {t.type === "income" ? "+" : t.type === "investment" ? "" : "-"} {formatShortCurrency(Number(t.amount))}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
              </div>
              {onDelete && !t.is_recurring && (
                <button
                  onClick={() => onDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
