/**
 * Formata um valor numérico para o formato de moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @returns String formatada em moeda (ex: "1.250,50")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Remove formatação de moeda e retorna apenas o valor numérico
 * @param value - String formatada em moeda (ex: "1.250,50" ou "R$ 1.250,50")
 * @returns Número puro (ex: 1250.50)
 */
export function parseCurrency(value: string): number {
  // Remove "R$" e espaços
  let cleaned = value.replace(/R\$\s?/g, "").trim();
  // Substitui ponto (separador de milhares) por nada
  cleaned = cleaned.replace(/\./g, "");
  // Substitui vírgula (separador decimal) por ponto
  cleaned = cleaned.replace(/,/g, ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Formata a entrada do usuário em tempo real enquanto digita
 * Mantém apenas números e uma vírgula decimal
 * @param input - Valor digitado pelo usuário
 * @returns String formatada para exibição
 */
export function formatCurrencyInput(input: string): string {
  // Remove tudo que não é número
  let cleaned = input.replace(/\D/g, "");

  // Se vazio, retorna vazio
  if (!cleaned) return "";

  // Converte para número (dividindo por 100 para ter as casas decimais)
  const num = parseInt(cleaned, 10) / 100;

  // Formata com 2 casas decimais
  return num.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Valida se o valor é um número válido e positivo
 * @param value - Valor a validar
 * @returns true se válido, false caso contrário
 */
export function isValidCurrency(value: string): boolean {
  const num = parseCurrency(value);
  return !isNaN(num) && num > 0;
}
