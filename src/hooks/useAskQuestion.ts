import { useCallback, useState } from "react";
import { getDataset } from "@/services/parser";
import { parseQuestion } from "@/services/questionRouter";
import { runQuery } from "@/services/analytics";
import { explainSpending } from "@/services/aiClient";
import type { AIExplanation, QueryResult } from "@/types/spending";

interface State {
  status: "idle" | "computing" | "explaining" | "ready" | "error";
  query: QueryResult | null;
  explanation: AIExplanation | null;
  error: string | null;
}

export function useAskQuestion() {
  const [state, setState] = useState<State>({ status: "idle", query: null, explanation: null, error: null });

  const ask = useCallback(async (question: string) => {
    setState({ status: "computing", query: null, explanation: null, error: null });
    try {
      const data = await getDataset();
      const parsed = parseQuestion(question);
      const query = runQuery(data, parsed);
      setState({ status: "explaining", query, explanation: null, error: null });
      const explanation = await explainSpending(question, query.contextForAI);
      setState({ status: "ready", query, explanation, error: null });
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: err instanceof Error ? err.message : "Something went wrong" }));
    }
  }, []);

  const reset = useCallback(() => setState({ status: "idle", query: null, explanation: null, error: null }), []);

  return { ...state, ask, reset };
}
