import { useState } from "react";
import { formatShortCurrency, formatDate } from "@/lib/format";
import { Transaction, useUpdateTransaction } from "@/hooks/useFinanceData";
import { Trash2, Check, Repeat, Edit2 } from "lucide-react";
import { toast } from "sonner";

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
  "Renda Fixa": "📈", "Renda Variável": "📉", Fundos: "🏢",
  Criptomoedas: "₿", Previdência: "👴", Outros: "📦",
};

const typeLabels = {
  income: "Receita",
  expense: "Gasto",
  investment: "Investimento",
};

const recurrenceLabels = {
  once: "Única",
  monthly: "Mensal",
  variable: "Variável",
};

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

export default function TransactionList({ transactions = [], onDelete, onEdit }: Props) {
  const [filter, setFilter] = useState<"all" | "income" | "expense" | "investment">("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "pending" | "paid">("all");
  const updateTx = useUpdateTransaction();

  const filtered = transactions.filter((t) => {
    if (!t) return false;
    const typeMatch = filter === "all" || t.type === filter;
    const paidMatch =
      paidFilter === "all" ||
      (paidFilter === "paid" && t.paid) ||
      (paidFilter === "pending" && !t.paid);
    return typeMatch && paidMatch;
  });

  const handleDeleteClick = (t: Transaction) => {
    if (t.is_recurring) {
      if (window.confirm("Esta é uma transação automática (Salário). Tem certeza que deseja excluí-la?")) {
        onDelete?.(t.id);
      }
    } else {
      onDelete?.(t.id);
    }
  };

  return (
    <div className="mt-6 pb-10">
      <div className="px-5 flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground/80">Transações</h2>
        <div className="flex gap-1">
          {(["all", "income", "expense", "investment"] as const).map((f) => (
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
          if (!t) return null;
          const isGoalContrib = t.category?.startsWith("Aporte:");
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
                  {t.category} · {t.type === "expense" ? recurrenceLabels[t.recurrence as keyof typeof recurrenceLabels] || t.recurrence : typeLabels[t.type as keyof typeof typeLabels]}
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

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={() => onEdit(t)}
                    className="text-muted-foreground hover:text-primary transition-colors p-1"
                    aria-label="Editar transação"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => handleDeleteClick(t)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    aria-label="Excluir transação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
