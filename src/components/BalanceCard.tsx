import { formatShortCurrency, getCurrentMonth } from "@/lib/format";
import { Transaction } from "@/hooks/useFinanceData";

interface Props {
  transactions: Transaction[];
}

export default function BalanceCard({ transactions }: Props) {
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  return (
    <div className="mx-5 mt-5 gradient-primary rounded-2xl p-6 relative overflow-hidden border border-primary/20">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-accent/[0.08]" />
      <div className="absolute -bottom-8 -left-5 w-32 h-32 rounded-full bg-primary/[0.12]" />
      <div className="relative z-10">
        <p className="text-xs text-foreground/60 uppercase tracking-widest mb-1.5">Saldo disponível</p>
        <p className="text-4xl font-semibold tracking-tight text-foreground font-mono">
          <span className="text-xl font-normal opacity-70 mr-1">R$</span>
          {balance.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
        </p>
        <div className="flex gap-5 mt-5">
          <div className="flex-1">
            <p className="text-[11px] text-foreground/50">↑ Receitas</p>
            <p className="text-sm font-semibold font-mono text-success">{formatShortCurrency(income)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-foreground/50">↓ Gastos</p>
            <p className="text-sm font-semibold font-mono text-destructive">{formatShortCurrency(expense)}</p>
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-foreground/50">📅 Mês</p>
            <p className="text-[13px] font-semibold text-accent capitalize">{getCurrentMonth()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
