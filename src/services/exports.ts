// Client-side exports: CSV of evidence, PDF of the answer.
// PDF uses browser print — keeps the bundle small and lets the user pick the destination.

import type { EvidenceRow } from "@/types/spending";

export function downloadCSV(rows: EvidenceRow[], filename = "civiclens-evidence.csv") {
  const headers = ["Fiscal Year", "Agency", "Vendor", "Category", "Date", "Amount", "Description"];
  const escape = (v: string | number) => {
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) => [r.fiscalYear, r.agency, r.vendor, r.category, r.paymentDate, r.amount, r.description].map(escape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function printAnswer() {
  window.print();
}

export async function copyAnswer(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
