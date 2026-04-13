export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatShortCurrency(value: number): string {
  return "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00");
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia 👋";
  if (h < 18) return "Boa tarde 👋";
  return "Boa noite 👋";
}

export function getCurrentMonth(): string {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
