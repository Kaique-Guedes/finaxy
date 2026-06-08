import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useTransactions, useCategories, useAddTransaction, useDeleteTransaction, useEnsureMonthlySalary, getMonthKey, Transaction } from "@/hooks/useFinanceData";
import { getGreeting, getInitials } from "@/lib/format";
import BalanceCard from "@/components/BalanceCard";
import QuickActions from "@/components/QuickActions";
import TransactionList from "@/components/TransactionList";
import AddTransactionModal from "@/components/AddTransactionModal";
import SalarySetup from "@/components/SalarySetup";
import MonthSelector from "@/components/MonthSelector";
import MonthlyNotes from "@/components/MonthlyNotes";
import { useMonth } from "@/contexts/MonthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile, isError: profileError } = useProfile();
  const { data: transactions = [], isLoading, isError: txError } = useTransactions();
  const { data: categories = [] } = useCategories();
  const addTx = useAddTransaction();
  const deleteTx = useDeleteTransaction();
  const [modalOpen, setModalOpen] = useState(false);
  const { monthKey, setMonthKey } = useMonth();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const navigate = useNavigate();

  // Auto-create recurring salary entry for current month
  try {
    useEnsureMonthlySalary();
  } catch (e) {
    console.error("Error in useEnsureMonthlySalary:", e);
  }

  const name = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = getInitials(name);
  const hasSalary = Number(profile?.monthly_salary || 0) > 0;

  const monthTransactions = transactions.filter((t) => t && t.date && getMonthKey(t.date) === monthKey);

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (profileError || txError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center">
        <p className="text-muted-foreground mb-4">Ocorreu um erro ao carregar seus dados.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-foreground rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-fade-in">
      {/* Top Bar */}
      <div className="px-5 pt-5 flex justify-between items-center">
        <div>
          <p className="text-[13px] text-muted-foreground">{getGreeting()}</p>
          <p className="text-lg font-semibold text-foreground tracking-tight">{name}</p>
        </div>
        <button
          onClick={() => navigate("/profile")}
          className="w-[38px] h-[38px] rounded-full gradient-accent flex items-center justify-center text-sm font-semibold text-foreground"
        >
          {initials}
        </button>
      </div>

      {!hasSalary && (
        <SalarySetup currentSalary={0} onDone={() => refetchProfile()} />
      )}

      <MonthSelector monthKey={monthKey} onChange={setMonthKey} />
      <BalanceCard monthKey={monthKey} />
      <QuickActions onAddTransaction={() => setModalOpen(true)} />
      <TransactionList 
        transactions={monthTransactions} 
        onDelete={(id) => deleteTx.mutate(id)}
        onEdit={handleEditTransaction}
      />
      <MonthlyNotes monthKey={monthKey} />

      {/* FAB */}
      <button
        onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-[calc(50%-199px)] w-[52px] h-[52px] rounded-full bg-primary text-foreground flex items-center justify-center text-2xl shadow-lg animate-pulse-glow z-[101]"
      >
        ＋
      </button>

      <AddTransactionModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSave={(tx) => addTx.mutate(tx)}
        categories={categories}
        defaultMonthKey={monthKey}
        editingTransaction={editingTransaction}
      />
    </div>
  );
}
