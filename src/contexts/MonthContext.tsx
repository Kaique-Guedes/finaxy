import { createContext, useContext, useState, ReactNode } from "react";
import { getMonthKey } from "@/hooks/useFinanceData";

type Ctx = { monthKey: string; setMonthKey: (k: string) => void };
const MonthContext = createContext<Ctx | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const [monthKey, setMonthKey] = useState<string>(getMonthKey(new Date()));
  return <MonthContext.Provider value={{ monthKey, setMonthKey }}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error("useMonth must be used inside MonthProvider");
  return ctx;
}
