export function fmt(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return (Number.parseInt(digits, 10) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parse(value: string): number {
  return Number(value.replace(/\./g, "").replace(",", ".")) || 0;
}

export function toInput(value: number): string {
  if (!value) return "";
  return fmt(String(Math.round(value * 100)));
}

export function brl(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
