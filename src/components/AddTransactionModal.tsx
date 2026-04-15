import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Category, Goal, useGoals, useUpdateGoal } from "@/hooks/useFinanceData";
import { toast } from "sonner";

type TxType = "expense" | "income" | "investment";

const investmentCategories = [
  "Renda Fixa", "Renda Variável", "Fundos", "Criptomoedas", "Previdência", "Outros",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (tx: { type: TxType; description: string; amount: number; category: string; date: string; recurrence: "once" | "monthly" | "variable" }) => void;
  categories: Category[];
}

export default function AddTransactionModal({ open, onClose, onSave, categories }: Props) {
  const [type, setType] = useState<TxType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [investCategory, setInvestCategory] = useState("Renda Fixa");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurrence, setRecurrence] = useState<"once" | "monthly" | "variable">("once");
  const [isGoalContribution, setIsGoalContribution] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");

  const { data: goals = [] } = useGoals();
  const updateGoal = useUpdateGoal();

  const activeGoals = goals.filter((g) => Number(g.saved_amount) < Number(g.target_amount));

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

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!description.trim() || !val || val <= 0 || !date) return;

    // Goal contribution logic
    if (isGoalContribution && selectedGoalId) {
      const goal = goals.find((g) => g.id === selectedGoalId);
      if (!goal) return;
      const remaining = Number(goal.target_amount) - Number(goal.saved_amount);
      if (val > remaining) {
        toast.error(`Valor excede o restante da meta (R$ ${remaining.toFixed(0)})`);
        return;
      }
      // Update goal saved_amount
      updateGoal.mutate({
        id: goal.id,
        saved_amount: Number(goal.saved_amount) + val,
      });
    }

    const defaultCat =
      isGoalContribution ? `Aporte: ${goals.find(g => g.id === selectedGoalId)?.name || "Meta"}` :
      type === "income" ? "Renda Extra" :
      type === "investment" ? investCategory :
      category || categories[0]?.name || "Outros";

    onSave({
      type: isGoalContribution ? "investment" : type,
      description: description.trim(),
      amount: val,
      category: defaultCat,
      date,
      recurrence: type === "investment" || isGoalContribution ? "once" : recurrence,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory("");
    setInvestCategory("Renda Fixa");
    setDate(new Date().toISOString().slice(0, 10));
    setRecurrence("once");
    setIsGoalContribution(false);
    setSelectedGoalId("");
  };

  const typeButtons: { key: TxType; label: string; activeClass: string }[] = [
    { key: "expense", label: "↓ Gasto", activeClass: "bg-destructive/15 border-destructive/40 text-destructive" },
    { key: "income", label: "↑ Renda Extra", activeClass: "bg-success/15 border-success/40 text-success" },
    { key: "investment", label: "📈 Investimento", activeClass: "bg-accent/15 border-accent/40 text-accent" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-10 border border-border border-b-0 animate-slide-up overflow-y-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        data-scrollable
      >
        <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-5" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-foreground text-center flex-1">Novo lançamento</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          {typeButtons.map((b) => (
            <button
              key={b.key}
              onClick={() => { setType(b.key); setIsGoalContribution(false); }}
              className={`flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
                type === b.key && !isGoalContribution ? b.activeClass : "border-border text-muted-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Goal contribution toggle */}
        {activeGoals.length > 0 && (
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
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none"
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
        </div>

        <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base mt-5 transition-colors hover:bg-primary/90">
          Salvar
        </button>
      </div>
    </div>
  );
}
