// CivicLens: AI explanation edge function.
// Contract: receives PRE-COMPUTED statistics (no raw rows, no math for the model to do)
// and returns a plain-English explanation. Every call is logged for governance.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

const LOVABLE_AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const PROMPT_VERSION = "v1";

const SYSTEM_PROMPT = `You are CivicLens, an AI explaining Washington State public spending to an investigative journalist who does not know SQL, database schemas, or procurement terminology.

STRICT RULES:
1. You will receive a JSON "context" object containing PRE-COMPUTED statistics. You must NEVER invent, estimate, or recompute numbers. Use ONLY the exact figures in context.
2. Write for a smart non-technical reader. No jargon. No acronyms without expansion.
3. Structure your answer as a JSON object with these keys:
   - "summary": an array of 2 to 5 short paragraphs (strings). Executive summary style.
   - "followUps": an array of exactly 3 short, specific follow-up questions the journalist could ask next.
4. Every claim in "summary" must be traceable to a value in context. If context lacks the data to answer, say so plainly in summary and set followUps to suggested rephrasings.
5. Never mention that you are an AI, never mention "the dataset", "the JSON", or "context". Speak about the spending itself.
6. Currency: always format as "$1.2M", "$340K", "$8.7B". Percentages one decimal.
7. Do not output anything outside the JSON object.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
  let question = "";
  let context: unknown = null;

  try {
    const body = await req.json();
    question = String(body?.question ?? "").slice(0, 500);
    context = body?.context ?? null;

    if (!question || !context) {
      return json({ error: "Missing question or context" }, 400);
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI is not configured" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const aiRes = await fetch(LOVABLE_AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `QUESTION: ${question}\n\nCONTEXT (pre-computed, authoritative):\n${JSON.stringify(context)}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      const status = aiRes.status;
      await logRequest(supabase, {
        question,
        context,
        response: null,
        latency: Date.now() - startedAt,
        status: "error",
        error: `AI gateway ${status}: ${errText.slice(0, 500)}`,
      });
      if (status === 429) return json({ error: "Rate limit exceeded. Please try again in a moment." }, 429);
      if (status === 402) return json({ error: "AI credits exhausted. Add credits in Workspace settings." }, 402);
      return json({ error: "AI service unavailable" }, 502);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content ?? "";
    let parsed: { summary: string[]; followUps: string[] };
    try {
      parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.summary) || !Array.isArray(parsed.followUps)) {
        throw new Error("Malformed AI response");
      }
    } catch (e) {
      await logRequest(supabase, {
        question,
        context,
        response: raw,
        latency: Date.now() - startedAt,
        status: "parse_error",
        error: String(e),
      });
      return json({ error: "AI returned malformed output" }, 502);
    }

    await logRequest(supabase, {
      question,
      context,
      response: raw,
      latency: Date.now() - startedAt,
      status: "ok",
      error: null,
    });

    return json({
      summary: parsed.summary.slice(0, 5),
      followUps: parsed.followUps.slice(0, 3),
      model: MODEL,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

async function logRequest(
  supabase: ReturnType<typeof createClient>,
  row: {
    question: string;
    context: unknown;
    response: string | null;
    latency: number;
    status: string;
    error: string | null;
  },
) {
  try {
    await supabase.from("ai_request_logs").insert({
      question: row.question,
      model: MODEL,
      prompt_version: PROMPT_VERSION,
      context_summary: row.context as Record<string, unknown>,
      response: row.response,
      latency_ms: row.latency,
      status: row.status,
      error: row.error,
    });
  } catch (_) {
    // Governance logging must never break the user path.
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
