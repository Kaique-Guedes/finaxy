import { useState } from "react";
import { X } from "lucide-react";
import { Category } from "@/hooks/useFinanceData";

type TxType = "expense" | "income" | "investment";

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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurrence, setRecurrence] = useState<"once" | "monthly" | "variable">("once");

  if (!open) return null;

  const handleSave = () => {
    const val = parseFloat(amount);
    if (!description.trim() || !val || val <= 0 || !date) return;

    const defaultCat =
      type === "income" ? "Renda Extra" :
      type === "investment" ? "Investimento" :
      category || categories[0]?.name || "Outros";

    onSave({
      type,
      description: description.trim(),
      amount: val,
      category: defaultCat,
      date,
      recurrence: type === "investment" ? "once" : recurrence,
    });
    setDescription("");
    setAmount("");
    setCategory("");
    setDate(new Date().toISOString().slice(0, 10));
    setRecurrence("once");
    onClose();
  };

  const typeButtons: { key: TxType; label: string; activeClass: string }[] = [
    { key: "expense", label: "↓ Gasto", activeClass: "bg-destructive/15 border-destructive/40 text-destructive" },
    { key: "income", label: "↑ Renda Extra", activeClass: "bg-success/15 border-success/40 text-success" },
    { key: "investment", label: "📈 Investimento", activeClass: "bg-accent/15 border-accent/40 text-accent" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center" onClick={onClose}>
      <div
        className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-10 border border-border border-b-0 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
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
              onClick={() => setType(b.key)}
              className={`flex-1 py-2.5 rounded-lg border text-[12px] font-medium transition-colors ${
                type === b.key ? b.activeClass : "border-border text-muted-foreground"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Descrição</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={type === "investment" ? "Ex: Tesouro Direto" : type === "income" ? "Ex: Freelance" : "Ex: Mercado"} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Valor (R$)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" step="0.01" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Data</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none" />
          </div>

          {/* Category only for expenses */}
          {type === "expense" && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer">
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
                <option value="Outros">💰 Outros</option>
              </select>
            </div>
          )}

          {/* Recurrence only for expenses */}
          {type === "expense" && (
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Tipo de gasto</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as "once" | "monthly" | "variable")} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground focus:border-primary focus:outline-none appearance-none cursor-pointer">
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
