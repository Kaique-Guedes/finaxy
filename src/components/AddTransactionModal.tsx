import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category, Goal, Transaction, useGoals, useUpdateGoal, useUpdateTransaction } from "@/hooks/useFinanceData";
import { formatCurrencyInput, parseCurrency } from "@/lib/currency";
import { toast } from "sonner";

type TxType = "expense" | "income" | "investment";

const investmentCategories = [
  "Reserva de Emergência", "Investimentos Futuros", "Renda Fixa", "Renda Variável", "Fundos", "Criptomoedas", "Previdência", "Outros",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (tx: { type: TxType; description: string; amount: number; category: string; date: string; recurrence: "once" | "monthly" | "variable"; paid?: boolean }) => void;
  categories: Category[];
  defaultMonthKey?: string;
  editingTransaction?: Transaction | null;
}

function defaultDateForMonth(monthKey?: string) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  if (!monthKey || monthKey === todayKey) return today.toISOString().slice(0, 10);
  return `${monthKey}-01`;
}

export default function AddTransactionModal({ open, onClose, onSave, categories, defaultMonthKey, editingTransaction }: Props) {
  const [type, setType] = useState<TxType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [investCategory, setInvestCategory] = useState("Renda Fixa");
  const [date, setDate] = useState(defaultDateForMonth(defaultMonthKey));
  const [recurrence, setRecurrence] = useState<"once" | "monthly" | "variable">("once");
  const [isGoalContribution, setIsGoalContribution] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const { data: goals = [] } = useGoals();
  const updateGoal = useUpdateGoal();
  const updateTx = useUpdateTransaction();

  const activeGoals = goals.filter((g) => Number(g.saved_amount) < Number(g.target_amount));

  // Declarar resetForm antes dos useEffect para evitar ReferenceError
  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setInvestCategory("Reserva de Emergência");
    setDate(defaultDateForMonth(defaultMonthKey));
    setRecurrence("once");
    setIsGoalContribution(false);
    setSelectedGoalId("");
    setIsPaid(false);
  };

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type as TxType);
      setDescription(editingTransaction.description);
      setAmount(formatCurrencyInput(editingTransaction.amount.toString()));
      setDate(editingTransaction.date);
      setRecurrence(editingTransaction.recurrence as "once" | "monthly" | "variable");
      setIsPaid(editingTransaction.paid);

      if (editingTransaction.type === "investment") {
        setInvestCategory(editingTransaction.category);
      } else if (editingTransaction.type === "expense") {
        setCategory(editingTransaction.category);
      }

      if (editingTransaction.category.startsWith("Aporte:")) {
        setIsGoalContribution(true);
      }
    } else {
      resetForm();
    }
  }, [editingTransaction, open]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const firstInput = document.querySelector('[data-modal-first-input]') as HTMLInputElement;
        firstInput?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setAmount(formatted);
  };

  const handleSave = () => {
    const val = parseCurrency(amount);
    if (!description.trim() || !val || val <= 0 || !date) {
      toast.error("Preencha todos os campos corretamente");
      return;
    }

    // Goal contribution logic
    if (isGoalContribution && selectedGoalId) {
      const goal = goals.find((g) => g.id === selectedGoalId);
      if (!goal) return;
      const remaining = Number(goal.target_amount) - Number(goal.saved_amount);
      if (val > remaining && !editingTransaction) {
        toast.error(`Valor excede o restante da meta (R$ ${remaining.toFixed(0)})`);
        return;
      }
      // Update goal saved_amount (apenas se for novo lançamento)
      if (!editingTransaction) {
        updateGoal.mutate({
          id: goal.id,
          saved_amount: Number(goal.saved_amount) + val,
        });
      }
    }

    const defaultCat =
      isGoalContribution ? `Aporte: ${goals.find(g => g.id === selectedGoalId)?.name || "Meta"}` :
      type === "income" ? "Renda Extra" :
      type === "investment" ? investCategory :
      category || categories[0]?.name || "Outros";

    const txData = {
      type: isGoalContribution ? "investment" as TxType : type,
      description: description.trim(),
      amount: val,
      category: defaultCat,
      date,
      recurrence: type === "investment" || isGoalContribution ? "once" as const : recurrence,
      paid: type === "expense" && !isGoalContribution ? isPaid : true,
    };

    if (editingTransaction) {
      // Atualizar transação existente
      updateTx.mutate({
        id: editingTransaction.id,
        ...txData,
      });
      toast.success("Transação atualizada!");
    } else {
      // Criar nova transação
      onSave(txData);
    }

    resetForm();
    onClose();
  };

  const typeButtons: { key: TxType; label: string; activeClass: string }[] = [
    { key: "expense", label: "↓ Gasto", activeClass: "bg-destructive/15 border-destructive/40 text-destructive" },
    { key: "income", label: "↑ Renda Extra", activeClass: "bg-success/15 border-success/40 text-success" },
    { key: "investment", label: "📈 Investimento", activeClass: "bg-accent/15 border-accent/40 text-accent" },
  ];

  const isEditing = !!editingTransaction;
  const modalTitle = isEditing ? "Editar lançamento" : "Novo lançamento";

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-24 border border-border border-b-0 animate-slide-up overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        data-scrollable
      >
        <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-5" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-foreground text-center flex-1">{modalTitle}</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          {typeButtons.map((b) => (
            <button
              key={b.key}
              onClick={() => { setType(b.key); setIsGoalContribution(false); }}
              disabled={isEditing}
              className={`flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
                isEditing ? "opacity-50 cursor-not-allowed" : ""
              } ${
                type === b.key && !isGoalContribution ? b.activeClass : "border-border text-muted-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Goal contribution toggle */}
        {activeGoals.length > 0 && !isEditing && (
          <button
            onClick={() => { setIsGoalContribution(!isGoalContribution); if (!isGoalContribution) setSelectedGoalId(activeGoals[0]?.id || ""); }}
            className={`w-full py-2.5 rounded-lg border text-[12px] font-medium transition-colors mb-4 ${
              isGoalContribution ? "bg-primary/15 border-primary/40 text-primary" : "border-border text-muted-foreground"
            }`}
          >
            🎯 Aporte em Meta
          </button>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Descrição</label>
            <input
              data-modal-first-input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isGoalContribution ? "Ex: Aporte mensal" : type === "investment" ? "Ex: Tesouro Direto" : type === "income" ? "Ex: Freelance" : "Ex: Mercado"}
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Valor (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0,00"
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none font-mono"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isEditing}
              className={`w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none ${
                isEditing ? "opacity-50 cursor-not-allowed" : ""
              }`}
            />
          </div>

          {/* Goal selector */}
          {isGoalContribution && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Meta</label>
              <select
                value={selectedGoalId}
                onChange={(e) => setSelectedGoalId(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {activeGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.icon} {g.name} — faltam R$ {(Number(g.target_amount) - Number(g.saved_amount)).toFixed(0)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Investment category */}
          {type === "investment" && !isGoalContribution && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Categoria do investimento</label>
              <select
                value={investCategory}
                onChange={(e) => setInvestCategory(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {investmentCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {/* Category only for expenses */}
          {type === "expense" && !isGoalContribution && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
                <option value="Outros">💰 Outros</option>
              </select>
            </div>
          )}

          {/* Recurrence only for expenses */}
          {type === "expense" && !isGoalContribution && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Tipo de gasto</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as "once" | "monthly" | "variable")}
                className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                <option value="monthly">Fixo (mensal)</option>
                <option value="once">Variável (único)</option>
                <option value="variable">Variável (recorrente)</option>
              </select>
            </div>
          )}

          {/* Status de pagamento para edição de gastos */}
          {isEditing && type === "expense" && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Status</label>
              <button
                onClick={() => setIsPaid(!isPaid)}
                className={`w-full py-3 rounded-lg border text-sm font-medium transition-colors ${
                  isPaid
                    ? "bg-success/15 border-success/40 text-success"
                    : "bg-destructive/15 border-destructive/40 text-destructive"
                }`}
              >
                {isPaid ? "✓ Pago" : "⏳ Pendente"}
              </button>
            </div>
          )}
        </div>

        <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base mt-5 transition-colors hover:bg-primary/90">
          {isEditing ? "Atualizar" : "Salvar"}
        </button>
      </div>
    </div>
  );
}
