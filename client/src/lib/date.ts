export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}
