// Formatters — one place so currency / percent look identical everywhere.

export function formatCurrency(n: number): string {
  if (!isFinite(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? "-" : ""}$${(abs / 1_000).toFixed(0)}K`;
  return `${n < 0 ? "-" : ""}$${abs.toFixed(0)}`;
}

export function formatExactCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function formatPercent(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
