import { useNavigate } from "react-router-dom";

interface Props {
  onAddTransaction: () => void;
}

const actions = [
  { label: "Adicionar", icon: "＋", action: "add", accent: true },
  { label: "Categorias", icon: "🏷", action: "/categories" },
  { label: "Metas", icon: "🎯", action: "/goals" },
  { label: "Projeção", icon: "📈", action: "/projection" },
  { label: "Alertas", icon: "🔔", action: "/alerts" },
];

export default function QuickActions({ onAddTransaction }: Props) {
  const navigate = useNavigate();

  return (
    <div className="px-5 mt-6">
      <p className="text-sm font-semibold text-foreground/80 mb-3">Ações rápidas</p>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={() => a.action === "add" ? onAddTransaction() : navigate(a.action)}
            className="flex flex-col items-center gap-2 flex-none"
          >
            <div
              className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl border border-border/50 ${
                a.accent ? "bg-primary border-primary/30" : "bg-secondary"
              }`}
            >
              {a.icon}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium whitespace-nowrap">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
