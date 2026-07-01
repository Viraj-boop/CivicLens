// Thin client for the AI explanation edge function.
import { supabase } from "@/integrations/supabase/client";
import type { AIExplanation } from "@/types/spending";

export async function explainSpending(question: string, context: Record<string, unknown>): Promise<AIExplanation> {
  const { data, error } = await supabase.functions.invoke("explain-spending", {
    body: { question, context },
  });

  if (error) throw new Error(error.message || "AI explanation failed");
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);

  const payload = data as AIExplanation;
  if (!Array.isArray(payload.summary) || !Array.isArray(payload.followUps)) {
    throw new Error("AI returned unexpected response shape");
  }
  return payload;
}
