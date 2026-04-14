import { useState } from "react";
import { useUpdateProfile } from "@/hooks/useFinanceData";

interface Props {
  currentSalary: number;
  onDone: () => void;
}

export default function SalarySetup({ currentSalary, onDone }: Props) {
  const [salary, setSalary] = useState(currentSalary > 0 ? String(currentSalary) : "");
  const updateProfile = useUpdateProfile();

  const handleSave = () => {
    const val = parseFloat(salary);
    if (!val || val <= 0) return;
    updateProfile.mutate({ monthly_salary: val }, { onSuccess: onDone });
  };

  return (
    <div className="mx-5 mt-5 glass-card p-5">
      <p className="text-lg font-semibold text-foreground mb-1">💼 Configure seu salário</p>
      <p className="text-xs text-muted-foreground mb-4">
        Informe seu salário mensal fixo. Ele será a base de todo o controle financeiro.
      </p>
      <div className="flex gap-3">
        <input
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
          placeholder="Ex: 5000"
          className="flex-1 bg-secondary border border-border rounded-lg px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
