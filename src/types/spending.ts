// Core domain types for CivicLens.
// One source of truth — every service, hook, and component imports from here.

export interface VendorPayment {
  readonly id: string;
  readonly fiscalYear: number;
  readonly agency: string;
  readonly vendor: string;
  readonly category: string;
  readonly paymentDate: string; // ISO
  readonly amount: number;      // USD
  readonly description: string;
}

export type QuestionIntent =
  | "top_vendors"
  | "top_agencies"
  | "top_categories"
  | "yoy_compare"
  | "category_explain"
  | "anomalies"
  | "overall";

export interface ParsedQuestion {
  readonly raw: string;
  readonly intent: QuestionIntent;
  readonly filters: {
    fiscalYears?: number[];
    agency?: string;
    vendor?: string;
    category?: string;
  };
}

export interface KeyInsights {
  totalSpending: number;
  paymentCount: number;
  largestVendor: { name: string; amount: number } | null;
  largestAgency: { name: string; amount: number } | null;
  largestCategory: { name: string; amount: number } | null;
  averagePayment: number;
  largestSinglePayment: { vendor: string; agency: string; amount: number; date: string } | null;
  yoyDifference: { fromYear: number; toYear: number; delta: number; percent: number } | null;
}

export type ChartType = "bar" | "line" | "treemap" | "pie" | "area" | "scatter";

export interface ChartSpec {
  type: ChartType;
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  yKey: string;
  nameKey?: string;
}

export interface EvidenceRow extends VendorPayment {
  highlighted: boolean;
}

export interface QueryResult {
  parsed: ParsedQuestion;
  insights: KeyInsights;
  chart: ChartSpec;
  evidence: EvidenceRow[];
  contextForAI: Record<string, unknown>;
}

export interface AIExplanation {
  summary: string[];
  followUps: string[];
  model: string;
  latencyMs: number;
}
