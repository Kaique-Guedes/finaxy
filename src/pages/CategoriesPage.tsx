import { useCategories, useTransactions, useAddCategory, useUpdateCategory } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2, Plus, Pencil, Check, X } from "lucide-react";
import { useState } from "react";

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useCategories();
  const { data: transactions = [] } = useTransactions();
  const addCategory = useAddCategory();
  const updateCategory = useUpdateCategory();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷");
  const [limit, setLimit] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState("");

  const byCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount);
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const handleAdd = () => {
    if (!name.trim()) return;
    addCategory.mutate({ name: name.trim(), icon, color: "#60a5fa", monthly_limit: parseFloat(limit) || 0 });
    setName(""); setIcon("🏷"); setLimit(""); setShowAdd(false);
  };

  const handleEditSave = (id: string) => {
    const val = parseFloat(editLimit);
    if (isNaN(val) || val < 0) return;
    updateCategory.mutate({ id, monthly_limit: val });
    setEditingId(null);
  };

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-foreground">Categorias</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-[13px] font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {showAdd && (
        <div className="mx-5 mb-4 glass-card p-4 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da categoria" className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          <div className="flex gap-3">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ícone" className="w-20 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground text-center focus:border-primary focus:outline-none" />
            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Limite mensal" className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>
          <button onClick={handleAdd} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Salvar</button>
        </div>
      )}

      <div className="px-5 space-y-2.5">
        {categories.map((c) => {
          const spent = byCategory[c.name] || 0;
          const pct = c.monthly_limit > 0 ? Math.min(100, Math.round((spent / c.monthly_limit) * 100)) : 0;
          const over = spent > c.monthly_limit && c.monthly_limit > 0;
          const nearLimit = !over && c.monthly_limit > 0 && pct >= 80;
          const isEditing = editingId === c.id;

          return (
            <div key={c.id} className={`glass-card p-4 ${nearLimit ? "ring-1 ring-warning/40" : ""} ${over ? "ring-1 ring-destructive/40" : ""}`}>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[22px]">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.name}</p>
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-muted-foreground">R$</span>
                      <input
                        type="number"
                        value={editLimit}
                        onChange={(e) => setEditLimit(e.target.value)}
                        autoFocus
                        className="w-24 bg-secondary border border-primary rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                      />
                      <button onClick={() => handleEditSave(c.id)} className="p-1 rounded bg-primary/20 text-primary hover:bg-primary/30">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 rounded bg-destructive/20 text-destructive hover:bg-destructive/30">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-muted-foreground">Limite: {formatShortCurrency(c.monthly_limit)}</p>
                      <button
                        onClick={() => { setEditingId(c.id); setEditLimit(String(c.monthly_limit)); }}
                        className="p-0.5 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold font-mono" style={{ color: over ? "#f87171" : nearLimit ? "#fbbf24" : c.color }}>{formatShortCurrency(spent)}</p>
                  <p className={`text-[11px] ${over ? "text-destructive" : nearLimit ? "text-warning" : "text-muted-foreground"}`}>
                    {over ? "⚠️ Estourado!" : nearLimit ? "⚠️ Quase no limite" : `${pct}% do limite`}
                  </p>
                </div>
              </div>
              {c.monthly_limit > 0 && (
                <div className="h-1.5 bg-foreground/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: over ? "#f87171" : nearLimit ? "#fbbf24" : c.color }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
