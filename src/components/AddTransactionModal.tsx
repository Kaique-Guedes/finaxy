import { useState } from "react";
import { X } from "lucide-react";
import { Category } from "@/hooks/useFinanceData";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (tx: { type: "income" | "expense"; description: string; amount: number; category: string; date: string; recurrence: "once" | "monthly" | "variable" }) => void;
  categories: Category[];
}

export default function AddTransactionModal({ open, onClose, onSave, categories }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState<"once" | "monthly" | "variable">("once");

  if (!open) return null;

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!description.trim() || !val || val <= 0) return;
    onSave({
      type,
      description: description.trim(),
      amount: val,
      category: category || categories[0]?.name || "Outros",
      date: new Date().toISOString().slice(0, 10),
      recurrence,
    });
    setDescription("");
    setAmount("");
    setCategory("");
    setRecurrence("once");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-10 border border-border border-b-0 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-5" />
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-foreground text-center flex-1">Nova transação</h2>
          <button onClick={onClose} className="text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-2.5 mb-4">
          <button
            onClick={() => setType("expense")}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              type === "expense"
                ? "bg-destructive/15 border-destructive/40 text-destructive"
                : "border-border text-muted-foreground"
            }`}
          >
            ↓ Gasto
          </button>
          <button
            onClick={() => setType("income")}
            className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              type === "income"
                ? "bg-success/15 border-success/40 text-success"
                : "border-border text-muted-foreground"
            }`}
          >
            ↑ Receita
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado, Salário..." className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Valor (R$)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" step="0.01" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Categoria</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer">
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
              ))}
              <option value="Salário">💼 Salário</option>
              <option value="Freelance">💡 Freelance</option>
              <option value="Outros">💰 Outros</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Recorrência</label>
            <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as "once" | "monthly" | "variable")} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer">
              <option value="once">Única vez</option>
              <option value="monthly">Mensal</option>
              <option value="variable">Variável</option>
            </select>
          </div>
        </div>

        <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base mt-5 transition-colors hover:bg-primary/90">
          Salvar
        </button>
      </div>
    </div>
  );
}
