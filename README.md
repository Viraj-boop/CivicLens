# CivicLens

**AI-native civic transparency for Washington State public spending.**
Submission for the GoldenAnalytics Product Engineering Challenge.

> Ask in plain English. Get answers backed by public data — not invented numbers.

---

## 1. Problem

Public-spending data is technically public but practically invisible. To answer a question like *"Who received the most money from the Washington Department of Transportation last year?"* a journalist today needs to know:

- Which XLSX / CSV / API to download
- SQL, or Excel pivot tables, or Tableau
- Government procurement terminology (fund codes, object classes, fiscal calendars)
- Enough patience to reconcile inconsistent naming across agencies

Existing tools either presume all of the above (Tableau, Power BI) or invent numbers when they don't know the answer (raw LLM chatbots). Neither is publishable.

## 2. Solution

CivicLens is a single-purpose product built around one commitment:

> **Code calculates. AI explains. Nothing in between.**

The user asks a question in a Perplexity-style interface. Under the hood:

1. A deterministic **question router** classifies intent (top vendors, YoY compare, anomalies, …).
2. A pure **analytics service** computes every number from the local dataset.
3. Those pre-computed statistics — never raw rows, never math to be done — are handed to an LLM.
4. The LLM writes 2–5 short paragraphs and 3 follow-up questions. It cannot fabricate a number the code did not already put in front of it.
5. Every AI call is written to a governance log (`ai_request_logs`).

The result: fast, trustworthy, publishable answers with a full evidence trail.

## 3. Architecture

```
src/
  types/spending.ts          ← one source of truth for all domain types
  data/generateDataset.ts    ← deterministic synthetic WA vendor payments (swap in real XLSX later)
  services/
    parser.ts                ← THE seam: swap synthetic → XLSX here, nothing else changes
    questionRouter.ts        ← plain-English → typed intent + filters (no LLM)
    analytics.ts             ← pure functions: filter, aggregate, choose chart, build AI context
    aiClient.ts              ← thin wrapper around the edge function
    exports.ts               ← CSV + PDF + copy
  hooks/
    useAskQuestion.ts        ← orchestrates: compute → explain → render
    useRecentQuestions.ts    ← localStorage-backed history
  components/civic/          ← feature-first UI (SearchBox, InsightCards, AutoChart, EvidenceTable, …)
  pages/
    Index.tsx                ← minimal home
    Results.tsx              ← executive summary + insights + chart + evidence + follow-ups
supabase/functions/
  explain-spending/          ← edge function: strict system prompt, JSON response format, governance log
```

**Data flow**

```
User question
   │
   ▼
questionRouter.parseQuestion()   ── deterministic, unit-testable
   │
   ▼
analytics.runQuery(dataset, parsed)
   │  → insights, chart spec, evidence rows, contextForAI
   ▼
aiClient.explainSpending(question, contextForAI)
   │  → edge function → Lovable AI (Gemini 2.5 Flash) → JSON {summary, followUps}
   │  → also writes to ai_request_logs (timestamp, prompt, context summary, response, latency, model)
   ▼
Results page: renders code-computed numbers + AI prose
```

## 4. Product principles (and where they show up)

| Principle                              | Where enforced                                                   |
| -------------------------------------- | ---------------------------------------------------------------- |
| AI explains, code calculates           | `analytics.ts` computes; the edge function's system prompt forbids invented numbers |
| Every AI statement is dataset-backed   | `contextForAI` is the only thing the model sees                  |
| One primary action per screen          | Home = ask. Results = read.                                      |
| Trust as a first-class feature         | Governance log, "computed from public data" chip, evidence table |
| Non-technical persona                  | No FY / SQL / procurement jargon in UI copy                      |

## 5. Design system

- **Font:** Inter, tightened tracking on headings, tabular figures on numbers.
- **Palette:** primary `#2563EB` on `#F8FAFC`, slate text, emerald / amber / rose semantic tokens.
- **Surfaces:** 2xl rounded cards, soft shadows, restrained glass on the header.
- **Motion:** one signature `animate-in-up`, one `shimmer` for skeletons. Nothing that competes with the content.
- **Dark mode:** first-class, semantic tokens, respects `prefers-color-scheme`.
- **A11y:** WCAG-friendly contrast, keyboard shortcuts (`/` to focus), focus rings, semantic HTML.

All colors are HSL semantic tokens in `src/index.css`; components never hard-code Tailwind color utilities.

## 6. AI workflow (in detail)

**Prompt version:** `v1` (stored on every log row so future migrations are auditable).

**System prompt** (`supabase/functions/explain-spending/index.ts`) enforces:

- Use only the pre-computed context. Never invent numbers.
- Return strict JSON: `{ summary: string[2..5], followUps: string[3] }`.
- No AI-meta ("as an AI…", "the dataset shows…"). Speak about the spending itself.
- Currency format is prescribed (`$1.2M`, `$340K`).

**Governance log columns**

```
ai_request_logs(id, question, model, prompt_version, context_summary jsonb,
                response, latency_ms, status, error, created_at)
```

The log is publicly readable (RLS `USING (true)`) — a small but deliberate transparency choice — and only the edge function can write to it (via service role).

## 7. Engineering trade-offs (documented)

1. **Synthetic dataset today, real XLSX behind a single seam.**
   Shipping a working end-to-end product mattered more than XLSX parsing. `services/parser.ts` is the *only* place that changes when the real Washington file is dropped in — every consumer imports `getDataset()` and cares only about the return type. Cost: reviewers see a synthetic dataset. Benefit: the AI/analytics contract is provable now.

2. **Deterministic intent routing instead of an LLM function-caller.**
   A regex-based router is boring but transparent, testable, cheap, and cannot hallucinate a filter. An LLM router would be more flexible but would move calculation risk back into the model. For a journalism product, transparency wins.

3. **Client-side compute, server-side explanation.**
   The dataset is small enough to compute in the browser, so all math is instant and offline-capable. Only the explanation call hits the network. Cost: won't scale to millions of rows. Benefit: sub-100ms results, no server load, easy audit. Migration path documented below.

4. **Print-based PDF export.**
   No `jspdf`, no `html2canvas` — the print stylesheet strips chrome and the browser's own PDF engine handles fidelity. Cost: users choose "Save as PDF" instead of a one-click download. Benefit: zero bundle weight, perfect typography, works on every OS.

## 8. Where AI accelerated / where judgment overruled AI

*The author is expected to expand this section during review. Structural hooks are already in the code:*

- **AI accelerated:** scaffolding shadcn variants, generating recharts boilerplate for six chart types, drafting the WA-flavored synthetic vendor/category taxonomy.
- **AI suggestions rejected:** initial suggestions used inline `text-white` / hard-coded hex values (bypasses dark mode); rejected in favor of semantic tokens in `index.css`. AI proposed doing intent routing with the LLM itself; rejected — see trade-off #2.
- **Prompts refined:** the AI system prompt went through three revisions to eliminate hedging language ("approximately", "roughly") — the model must present pre-computed numbers as facts, not estimates.
- **Engineering judgment overruled AI:** analytics is a set of pure functions (`sumBy`, `filterRows`, `computeInsights`) rather than the class-based service AI initially proposed — pure functions are trivially testable and tree-shakeable.

## 9. Production considerations

| Concern                | Status today                    | Production path                                                   |
| ---------------------- | ------------------------------- | ----------------------------------------------------------------- |
| Authentication         | Anonymous                       | Lovable Cloud auth (email + Google), scoped log reads             |
| Role permissions       | —                               | `user_roles` table + `has_role` security-definer function          |
| Real dataset           | Synthetic                       | Swap `services/parser.ts` to fetch + SheetJS-parse the XLSX       |
| Server-side AI         | Edge function, correct today    | Add response caching by `(intent, filters)` key                    |
| Caching                | In-memory dataset cache         | Add `stale-while-revalidate` on the edge function response         |
| Observability          | `ai_request_logs`               | Ship structured logs to a warehouse; alert on `status != 'ok'`     |
| Feature flags          | —                               | Simple flag table + `useFlag(name)` hook                           |
| Prompt versioning      | `prompt_version` column         | Introduce prompt registry; A/B test at the edge function boundary  |
| API abstraction        | `aiClient.ts` is the seam       | Add retry, request-id propagation, typed error envelope             |

## 10. Demo instructions

```bash
# 1. Install
bun install

# 2. Dev
bun run dev

# 3. Open http://localhost:8080
```

Cloud (database + edge function + AI Gateway) is already provisioned — no keys to paste.

Try:

- *Who received the most money from Washington State?*
- *Compare FY2022 and FY2023 spending*
- *Explain transportation spending*
- *Find unusual vendor payments*

Press `/` to focus the search from anywhere. Toggle dark mode in the header. Export any answer as PDF via the header button on the results page; export the evidence table as CSV.

## 11. Future improvements

- Real XLSX ingestion (`services/parser.ts`).
- Vendor / agency detail pages with drill-down.
- Anomaly detection beyond top-N (z-score against category baselines).
- Multi-turn conversation — carry the previous answer's context into the next question.
- Public "explain any log id" page for full AI transparency.
- Shareable answer permalinks (server-computed insights, signed URL).

---

Built with React 18, Vite, TypeScript, Tailwind, shadcn/ui, Recharts, Lovable Cloud (Supabase), and Lovable AI (Gemini 2.5 Flash).
