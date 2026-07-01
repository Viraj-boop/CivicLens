// Deterministic question → intent router.
// AI does NOT parse structured intent — this file does, in code.
// This is the "code calculates, AI explains" contract at its clearest.

import type { ParsedQuestion, QuestionIntent } from "@/types/spending";

const YEAR_RE = /\b(20\d{2})\b/g;

interface Rule {
  intent: QuestionIntent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  { intent: "yoy_compare", patterns: [/\bcompare\b/i, /\bvs\b/i, /\bversus\b/i, /year over year/i, /yoy/i, /\bdifference between\b/i] },
  { intent: "anomalies", patterns: [/\bunusual\b/i, /\banomal/i, /\boutlier/i, /\bsuspicious\b/i, /\blargest\s+single\b/i] },
  { intent: "top_vendors", patterns: [/\bvendor/i, /\bcontractor/i, /\brecipient/i, /\bwho\s+received\b/i, /\bpaid\s+the\s+most\b/i] },
  { intent: "top_agencies", patterns: [/\bagency\b/i, /\bagencies\b/i, /\bdepartment/i] },
  { intent: "top_categories", patterns: [/\bcategor/i, /\bwhat kind\b/i, /\btype of spending\b/i] },
  { intent: "category_explain", patterns: [/\bexplain\b/i, /\bwhy\b/i, /\bbreakdown\b/i, /\btransportation\b/i, /\bhealth/i, /\beducation\b/i, /\benvironment/i] },
];

export function parseQuestion(raw: string): ParsedQuestion {
  const q = raw.trim();
  const yearsMatch = Array.from(q.matchAll(YEAR_RE)).map((m) => parseInt(m[1], 10));
  const fiscalYears = yearsMatch.length ? Array.from(new Set(yearsMatch)) : undefined;

  let intent: QuestionIntent = "overall";
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(q))) {
      intent = rule.intent;
      break;
    }
  }

  // Category hint extraction — cheap keyword mapping.
  const lower = q.toLowerCase();
  let category: string | undefined;
  if (lower.includes("transportation") || lower.includes("highway")) category = "Transportation";
  else if (lower.includes("health") || lower.includes("medicaid")) category = "Healthcare Services";
  else if (lower.includes("education") || lower.includes("school")) category = "Education Services";
  else if (lower.includes("environment") || lower.includes("ecology")) category = "Environmental Services";
  else if (lower.includes("technology") || lower.includes("software")) category = "Technology & Software";
  else if (lower.includes("construction") || lower.includes("infrastructure")) category = "Construction & Infrastructure";

  if (intent === "category_explain" && !category) intent = "overall";

  return {
    raw: q,
    intent,
    filters: { fiscalYears, category },
  };
}
