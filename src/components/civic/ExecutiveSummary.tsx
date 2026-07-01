import {
  Copy,
  Printer,
  ShieldCheck,
  Database,
  Sparkles,
  Clock,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { copyAnswer, printAnswer } from "@/services/exports";

interface Props {
  paragraphs: string[];
  question: string;
  model: string;
  latencyMs: number;
}

export function ExecutiveSummary({
  paragraphs,
  question,
  model,
  latencyMs,
}: Props) {
  async function onCopy() {
    const text = `Question:\n${question}\n\n${paragraphs.join("\n\n")}`;

    const ok = await copyAnswer(text);

    toast[ok ? "success" : "error"](
      ok ? "Answer copied successfully." : "Failed to copy answer."
    );
  }

  return (
    <section className="surface-card p-7 sm:p-8 animate-in-up">

      {/* Question */}

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground font-medium">
          Question
        </p>

        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
          {question}
        </h1>

      </div>

      {/* Trust Banner */}

      <div className="rounded-2xl border bg-muted/30 p-5 mb-8">

        <div className="flex flex-wrap gap-5 text-sm">

          <div className="flex items-center gap-2">

            <Database className="h-4 w-4 text-primary" />

            <span>
              <strong>Dataset:</strong> Washington Vendor Payments FY2022–FY2023
            </span>

          </div>

          <div className="flex items-center gap-2">

            <ShieldCheck className="h-4 w-4 text-green-600" />

            <span>
              <strong>Calculations:</strong> Deterministic
            </span>

          </div>

          <div className="flex items-center gap-2">

            <Sparkles className="h-4 w-4 text-primary" />

            <span>
              <strong>AI:</strong> Explanation Only
            </span>

          </div>

          <div className="flex items-center gap-2">

            <Clock className="h-4 w-4 text-orange-500" />

            <span>
              <strong>Latency:</strong> {latencyMs} ms
            </span>

          </div>

        </div>

      </div>

      {/* Executive Summary */}

      <div>

        <h2 className="text-xl font-semibold flex items-center gap-2 mb-5">

          <Sparkles className="h-5 w-5 text-primary" />

          Executive Summary

        </h2>

        <div className="space-y-5 max-w-4xl text-[15px] leading-8 text-foreground/90">

          {paragraphs.map((paragraph, index) => (

            <p key={index}>
              {paragraph}
            </p>

          ))}

        </div>

      </div>

      {/* Explainability */}

      <div className="mt-10 rounded-2xl border bg-card p-6">

        <h3 className="font-semibold mb-5">
          How this answer was generated
        </h3>

        <div className="grid md:grid-cols-2 gap-4">

          <div className="flex gap-3">

            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />

            <div>

              <p className="font-medium">
                Relevant records retrieved
              </p>

              <p className="text-sm text-muted-foreground">
                CivicLens filtered the public dataset using your natural language
                question.
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />

            <div>

              <p className="font-medium">
                Statistics calculated
              </p>

              <p className="text-sm text-muted-foreground">
                Totals, averages and rankings were calculated directly in code.
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />

            <div>

              <p className="font-medium">
                AI generated explanation
              </p>

              <p className="text-sm text-muted-foreground">
                The language model summarized verified statistics into plain
                English.
              </p>

            </div>

          </div>

          <div className="flex gap-3">

            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />

            <div>

              <p className="font-medium">
                Transparent evidence
              </p>

              <p className="text-sm text-muted-foreground">
                Supporting rows are displayed below for independent verification.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* Footer */}

      <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-t pt-6">

        <div className="text-xs text-muted-foreground">

          <span className="font-medium">
            Model:
          </span>{" "}
          {model}

          <span className="mx-2">•</span>

          Prompt logged for governance and auditing.

        </div>

        <div className="flex gap-2 no-print">

          <Button
            size="sm"
            variant="outline"
            onClick={onCopy}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={printAnswer}
          >
            <Printer className="mr-2 h-4 w-4" />
            Export PDF
          </Button>

        </div>

      </div>

    </section>
  );
} 