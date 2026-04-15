import { useState } from "react";
import { useGoals, useAddGoal, useUpdateGoal, useDeleteGoal, useFinanceSummary } from "@/hooks/useFinanceData";
import { formatShortCurrency } from "@/lib/format";
import { Loader2, X, Plus, Pencil, Trash2 } from "lucide-react";

const goalBarColors = ["#3b82f6", "#38bdf8", "#a78bfa", "#4ade80", "#f59e0b", "#f87171"];

export default function GoalsPage() {
  const { data: goals = [], isLoading } = useGoals();
  const addGoal = useAddGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const summary = useFinanceSummary();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏦");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("0");
  const [months, setMonths] = useState("12");

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const openNew = () => {
    setEditingGoal(null);
    setName(""); setIcon("🏦"); setTarget(""); setSaved("0"); setMonths("12");
    setModalOpen(true);
  };

  const openEdit = (g: typeof goals[0]) => {
    setEditingGoal(g.id);
    setName(g.name);
    setIcon(g.icon);
    setTarget(String(g.target_amount));
    setSaved(String(g.saved_amount));
    setMonths(String(g.months));
    setModalOpen(true);
  };

  const handleSave = () => {
    const t = parseFloat(target);
    if (!name.trim() || !t) return;
    const s = parseFloat(saved) || 0;

    if (editingGoal) {
      updateGoal.mutate({
        id: editingGoal,
        name: name.trim(),
        icon,
        target_amount: t,
        saved_amount: Math.min(s, t),
        months: parseInt(months) || 12,
      });
    } else {
      addGoal.mutate({ name: name.trim(), icon, target_amount: t, saved_amount: Math.min(s, t), months: parseInt(months) || 12 });
    }
    setModalOpen(false);
  };

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-foreground">Metas</h1>
        <button onClick={openNew} className="bg-primary text-primary-foreground px-3.5 py-1.5 rounded-lg text-[13px] font-semibold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {goals.map((g, i) => {
          const pct = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
          const monthly = Math.max(0, (Number(g.target_amount) - Number(g.saved_amount)) / g.months);
          const col = goalBarColors[i % goalBarColors.length];
          const completed = pct >= 100;
          return (
            <div key={g.id} className={`glass-card p-4 relative ${completed ? "ring-1 ring-success/40" : ""}`}>
              {completed && <span className="absolute top-2 right-2 text-[10px] bg-success/20 text-success px-1.5 py-0.5 rounded-md font-semibold">✓ Concluída</span>}
              <div className="flex items-start justify-between">
                <span className="text-[22px]">{g.icon}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(g)} className="p-1 text-muted-foreground hover:text-accent">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteGoal.mutate(g.id)} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[13px] font-semibold text-foreground mt-2 mb-1">{g.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono mb-2.5">Meta: {formatShortCurrency(Number(g.target_amount))}</p>
              <div className="h-1 bg-foreground/[0.08] rounded-full mb-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: col }} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold" style={{ color: col }}>{pct}%</span>
                <span className="text-[11px] text-muted-foreground">{formatShortCurrency(Number(g.saved_amount))}</span>
              </div>
              {!completed && <p className="text-[11px] text-muted-foreground mt-1.5">{formatShortCurrency(monthly)}/mês</p>}
            </div>
          );
        })}
      </div>

      {goals.length > 0 && (
        <>
          <p className="text-sm font-semibold text-foreground/80 px-5 mt-6 mb-3">Análise de viabilidade</p>
          <div className="px-5 space-y-2.5">
            {goals.filter(g => Number(g.saved_amount) < Number(g.target_amount)).map((g) => {
              const monthly = (Number(g.target_amount) - Number(g.saved_amount)) / g.months;
              const ok = monthly <= summary.available;
              return (
                <div key={g.id} className="glass-card flex items-center gap-3 p-3.5">
                  <span className="text-lg">{g.icon}</span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-foreground">{g.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Guardar {formatShortCurrency(monthly)}/mês por {g.months} meses</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${ok ? "bg-success/[0.12] text-success" : "bg-destructive/[0.12] text-destructive"}`}>
                    {ok ? "✓ Viável" : "! Risco"}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-end justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-card rounded-t-3xl w-full max-w-[430px] p-6 pb-10 border border-border border-b-0 animate-slide-up" onClick={(e) => e.stopPropagation()} data-scrollable>
            <div className="w-10 h-1 bg-foreground/15 rounded-full mx-auto mb-5" />
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-semibold text-foreground flex-1 text-center">{editingGoal ? "Editar meta" : "Nova meta"}</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Nome da meta</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Ícone</label>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground focus:border-primary focus:outline-none appearance-none">
                  <option value="🏦">🏦 Reserva</option>
                  <option value="✈">✈ Viagem</option>
                  <option value="🚗">🚗 Carro</option>
                  <option value="🏠">🏠 Imóvel</option>
                  <option value="📈">📈 Investimento</option>
                  <option value="🎓">🎓 Educação</option>
                  <option value="⭐">⭐ Outro</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Valor alvo (R$)</label>
                <input type="text" inputMode="decimal" pattern="[0-9]*" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="10000" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Valor já guardado (R$)</label>
                <input type="text" inputMode="decimal" pattern="[0-9]*" value={saved} onChange={(e) => setSaved(e.target.value)} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" autoComplete="off" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1.5 block">Prazo (meses)</label>
                <input type="text" inputMode="numeric" pattern="[0-9]*" value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" className="w-full bg-secondary border border-border rounded-lg px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" autoComplete="off" />
              </div>
            </div>
            <button onClick={handleSave} className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base mt-5">{editingGoal ? "Salvar alterações" : "Criar meta"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
