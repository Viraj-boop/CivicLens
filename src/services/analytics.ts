// All numerical calculations live here. AI never does math.
// Pure functions, easy to unit test, easy to swap the data source underneath.

import type {
  ChartSpec,
  EvidenceRow,
  KeyInsights,
  ParsedQuestion,
  QueryResult,
  VendorPayment,
} from "@/types/spending";

function sumBy<K extends string>(rows: VendorPayment[], key: keyof VendorPayment): Array<{ name: string; amount: number; count: number }> {
  const map = new Map<string, { amount: number; count: number }>();
  for (const r of rows) {
    const k = String(r[key]);
    const prev = map.get(k) ?? { amount: 0, count: 0 };
    prev.amount += r.amount;
    prev.count += 1;
    map.set(k, prev);
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, amount: v.amount, count: v.count }))
    .sort((a, b) => b.amount - a.amount);
}

function filterRows(rows: VendorPayment[], parsed: ParsedQuestion): VendorPayment[] {
  return rows.filter((r) => {
    if (parsed.filters.fiscalYears && !parsed.filters.fiscalYears.includes(r.fiscalYear)) return false;
    if (parsed.filters.category && r.category !== parsed.filters.category) return false;
    if (parsed.filters.agency && r.agency !== parsed.filters.agency) return false;
    if (parsed.filters.vendor && r.vendor !== parsed.filters.vendor) return false;
    return true;
  });
}

function computeInsights(rows: VendorPayment[], all: VendorPayment[], parsed: ParsedQuestion): KeyInsights {
  const totalSpending = rows.reduce((s, r) => s + r.amount, 0);
  const paymentCount = rows.length;
  const byVendor = sumBy(rows, "vendor");
  const byAgency = sumBy(rows, "agency");
  const byCategory = sumBy(rows, "category");
  const largestPayment = rows.reduce<VendorPayment | null>((best, r) => (!best || r.amount > best.amount ? r : best), null);

  // YoY: pick the two most recent years present (or the two years the user named).
  let yoy: KeyInsights["yoyDifference"] = null;
  const yearsSet = parsed.filters.fiscalYears?.length
    ? parsed.filters.fiscalYears
    : Array.from(new Set(all.map((r) => r.fiscalYear))).sort();
  if (yearsSet.length >= 2) {
    const [from, to] = [yearsSet[yearsSet.length - 2], yearsSet[yearsSet.length - 1]];
    const fromTotal = all.filter((r) => r.fiscalYear === from).reduce((s, r) => s + r.amount, 0);
    const toTotal = all.filter((r) => r.fiscalYear === to).reduce((s, r) => s + r.amount, 0);
    const delta = toTotal - fromTotal;
    const percent = fromTotal ? (delta / fromTotal) * 100 : 0;
    yoy = { fromYear: from, toYear: to, delta, percent };
  }

  return {
    totalSpending,
    paymentCount,
    largestVendor: byVendor[0] ? { name: byVendor[0].name, amount: byVendor[0].amount } : null,
    largestAgency: byAgency[0] ? { name: byAgency[0].name, amount: byAgency[0].amount } : null,
    largestCategory: byCategory[0] ? { name: byCategory[0].name, amount: byCategory[0].amount } : null,
    averagePayment: paymentCount ? totalSpending / paymentCount : 0,
    largestSinglePayment: largestPayment
      ? { vendor: largestPayment.vendor, agency: largestPayment.agency, amount: largestPayment.amount, date: largestPayment.paymentDate }
      : null,
    yoyDifference: yoy,
  };
}

function chooseChart(rows: VendorPayment[], all: VendorPayment[], parsed: ParsedQuestion): ChartSpec {
  const byVendor = sumBy(rows, "vendor").slice(0, 10);
  const byAgency = sumBy(rows, "agency").slice(0, 8);
  const byCategory = sumBy(rows, "category");

  switch (parsed.intent) {
    case "top_vendors":
      return { type: "bar", title: "Top 10 Vendors by Total Payments", data: byVendor.map((r) => ({ name: r.name, amount: r.amount })), xKey: "name", yKey: "amount" };
    case "top_agencies":
      return { type: "bar", title: "Top Agencies by Total Spending", data: byAgency.map((r) => ({ name: r.name, amount: r.amount })), xKey: "name", yKey: "amount" };
    case "top_categories":
      return { type: "treemap", title: "Spending by Category", data: byCategory.map((r) => ({ name: r.name, amount: r.amount })), xKey: "name", yKey: "amount" };
    case "yoy_compare": {
      const years = Array.from(new Set(all.map((r) => r.fiscalYear))).sort();
      const data = years.map((y) => ({ name: `FY${y}`, amount: all.filter((r) => r.fiscalYear === y).reduce((s, r) => s + r.amount, 0) }));
      return { type: "line", title: "Total Spending by Fiscal Year", data, xKey: "name", yKey: "amount" };
    }
    case "anomalies": {
      const top = [...rows].sort((a, b) => b.amount - a.amount).slice(0, 25);
      return {
        type: "scatter",
        title: "Largest 25 Individual Payments",
        data: top.map((r, i) => ({ name: r.vendor, amount: r.amount, index: i + 1 })),
        xKey: "index",
        yKey: "amount",
      };
    }
    case "category_explain": {
      const years = Array.from(new Set(rows.map((r) => r.fiscalYear))).sort();
      const data = years.map((y) => ({ name: `FY${y}`, amount: rows.filter((r) => r.fiscalYear === y).reduce((s, r) => s + r.amount, 0) }));
      return { type: "area", title: `${parsed.filters.category ?? "Category"} spending over time`, data, xKey: "name", yKey: "amount" };
    }
    default:
      return { type: "pie", title: "Spending by Category", data: byCategory.map((r) => ({ name: r.name, amount: r.amount })), xKey: "name", yKey: "amount" };
  }
}

function buildEvidence(rows: VendorPayment[], parsed: ParsedQuestion): EvidenceRow[] {
  // Highlight rows that most directly support the insight surfaced.
  const sorted = [...rows].sort((a, b) => b.amount - a.amount);
  const highlightIds = new Set(sorted.slice(0, parsed.intent === "anomalies" ? 8 : 5).map((r) => r.id));
  return sorted.map((r) => ({ ...r, highlighted: highlightIds.has(r.id) }));
}

function buildContext(insights: KeyInsights, parsed: ParsedQuestion, chart: ChartSpec, rows: VendorPayment[]) {
  const byVendor = sumBy(rows, "vendor").slice(0, 5);
  const byAgency = sumBy(rows, "agency").slice(0, 5);
  const byCategory = sumBy(rows, "category").slice(0, 5);
  return {
    question: parsed.raw,
    intent: parsed.intent,
    filters: parsed.filters,
    insights,
    topVendors: byVendor,
    topAgencies: byAgency,
    topCategories: byCategory,
    chart: { type: chart.type, title: chart.title, points: chart.data.slice(0, 12) },
    rowCount: rows.length,
  };
}

export function runQuery(all: VendorPayment[], parsed: ParsedQuestion): QueryResult {
  const filtered = filterRows(all, parsed);
  const scope = filtered.length ? filtered : all;
  const insights = computeInsights(scope, all, parsed);
  const chart = chooseChart(scope, all, parsed);
  const evidence = buildEvidence(scope, parsed);
  const contextForAI = buildContext(insights, parsed, chart, scope);
  return { parsed, insights, chart, evidence, contextForAI };
}
