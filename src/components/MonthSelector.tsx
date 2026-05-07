import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  monthKey: string; // "YYYY-MM"
  onChange: (key: string) => void;
}

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function MonthSelector({ monthKey, onChange }: Props) {
  return (
    <div className="mx-5 mt-4 flex items-center justify-between glass-card px-4 py-2.5">
      <button
        onClick={() => onChange(shiftMonth(monthKey, -1))}
        className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-foreground"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-semibold text-foreground capitalize">
        {formatMonthLabel(monthKey)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(monthKey, 1))}
        className="w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-foreground"
        aria-label="Próximo mês"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
