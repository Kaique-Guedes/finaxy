import { useAuth } from "@/hooks/useAuth";
import { useProfile, useTransactions, useGoals } from "@/hooks/useFinanceData";
import { getInitials } from "@/lib/format";
import { Loader2, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: transactions = [] } = useTransactions();
  const { data: goals = [] } = useGoals();

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  const name = profile?.name || "Usuário";
  const email = profile?.email || user?.email || "";
  const initials = getInitials(name);
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) : "";

  return (
    <div className="pb-24 animate-fade-in">
      <div className="px-5 pt-6 pb-6 text-center">
        <div className="w-[72px] h-[72px] rounded-full gradient-accent flex items-center justify-center text-[26px] font-semibold mx-auto mb-3">
          {initials}
        </div>
        <p className="text-lg font-semibold text-foreground">{name}</p>
        <p className="text-[13px] text-muted-foreground">{email}</p>
      </div>

      <div className="px-5 space-y-3">
        <div className="glass-card p-4">
          <Row label="Membro desde" value={memberSince} />
          <Row label="Transações" value={String(transactions.length)} />
          <Row label="Metas ativas" value={String(goals.length)} />
        </div>

        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Preferências</p>
          <Row label="Moeda" value="BRL (R$)" />
          <Row label="Tema" value="Escuro" />
        </div>

        <button
          onClick={signOut}
          className="w-full py-3.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive font-semibold text-[15px] flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
