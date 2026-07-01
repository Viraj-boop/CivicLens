import { useMemo, useState } from "react";
import type { EvidenceRow } from "@/types/spending";
import { formatExactCurrency, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Star } from "lucide-react";
import { downloadCSV } from "@/services/exports";

type SortKey = "amount" | "paymentDate" | "fiscalYear" | "agency" | "vendor";

interface Props {
  rows: EvidenceRow[];
}

const PAGE_SIZE = 15;

export function EvidenceTable({ rows }: Props) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? rows.filter((r) =>
          r.vendor.toLowerCase().includes(needle) ||
          r.agency.toLowerCase().includes(needle) ||
          r.category.toLowerCase().includes(needle) ||
          r.description.toLowerCase().includes(needle),
        )
      : rows;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [rows, q, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("desc"); }
    setPage(1);
  }

  function SortHead({ k, label, className }: { k: SortKey; label: string; className?: string }) {
    const active = sortKey === k;
    const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    return (
      <th className={`text-left font-medium text-muted-foreground text-xs uppercase tracking-wider py-3 px-4 ${className ?? ""}`}>
        <button className="inline-flex items-center gap-1 hover:text-foreground transition" onClick={() => toggleSort(k)}>
          {label} <Icon className="h-3 w-3" />
        </button>
      </th>
    );
  }

  return (
    <div className="surface-card overflow-hidden animate-in-up">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between p-4 border-b border-border/60">
        <div>
          <h3 className="font-semibold">Evidence</h3>
          <p className="text-xs text-muted-foreground">{filtered.length.toLocaleString()} payments · rows highlighted with <Star className="inline h-3 w-3 text-warning fill-warning" /> most directly support the answer.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search evidence…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="w-56" />
          <Button size="sm" variant="outline" onClick={() => downloadCSV(filtered)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-8" />
              <SortHead k="fiscalYear" label="FY" />
              <SortHead k="paymentDate" label="Date" />
              <SortHead k="agency" label="Agency" />
              <SortHead k="vendor" label="Vendor" />
              <th className="text-left font-medium text-muted-foreground text-xs uppercase tracking-wider py-3 px-4">Category</th>
              <SortHead k="amount" label="Amount" className="text-right" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className={`border-t border-border/50 hover:bg-muted/30 transition ${r.highlighted ? "bg-warning/5" : ""}`}>
                <td className="px-3">{r.highlighted && <Star className="h-3.5 w-3.5 text-warning fill-warning" />}</td>
                <td className="py-3 px-4 tabular-nums text-muted-foreground">FY{r.fiscalYear}</td>
                <td className="py-3 px-4 tabular-nums text-muted-foreground">{formatDate(r.paymentDate)}</td>
                <td className="py-3 px-4">{r.agency}</td>
                <td className="py-3 px-4 font-medium">{r.vendor}</td>
                <td className="py-3 px-4 text-muted-foreground">{r.category}</td>
                <td className="py-3 px-4 text-right tabular-nums font-semibold">{formatExactCurrency(r.amount)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No rows match your search.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between p-3 border-t border-border/60 text-xs text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
        </div>
      </div>
    </div>
  );
}
