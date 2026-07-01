import { Copy, Printer, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { copyAnswer, printAnswer } from "@/services/exports";

interface Props {
  paragraphs: string[];
  question: string;
  model: string;
  latencyMs: number;
}

export function ExecutiveSummary({ paragraphs, question, model, latencyMs }: Props) {
  async function onCopy() {
    const text = `Q: ${question}\n\n${paragraphs.join("\n\n")}`;
    const ok = await copyAnswer(text);
    toast[ok ? "success" : "error"](ok ? "Answer copied" : "Copy failed");
  }

  return (
    <section className="surface-card p-6 sm:p-8 animate-in-up">
      <div className="flex items-start justify-between gap-4 no-print">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Numbers computed from public data · AI explanation only</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy</Button>
          <Button size="sm" variant="outline" onClick={printAnswer}><Printer className="h-3.5 w-3.5 mr-1.5" /> PDF</Button>
        </div>
      </div>
      <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">{question}</h2>
      <div className="mt-5 space-y-4 max-w-3xl text-[15px] leading-relaxed text-foreground/90">
        {paragraphs.map((p, i) => (<p key={i}>{p}</p>))}
      </div>
      <div className="mt-6 text-[11px] text-muted-foreground uppercase tracking-wider">
        Explained by {model} · {latencyMs}ms · logged for governance
      </div>
    </section>
  );
}
