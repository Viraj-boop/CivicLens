import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppHeader } from "@/components/civic/AppHeader";
import { SearchBox } from "@/components/civic/SearchBox";
import { InsightCards } from "@/components/civic/InsightCards";
import { AutoChart } from "@/components/civic/AutoChart";
import { EvidenceTable } from "@/components/civic/EvidenceTable";
import { FollowUps } from "@/components/civic/FollowUps";
import { ExecutiveSummary } from "@/components/civic/ExecutiveSummary";
import { ResultsSkeleton } from "@/components/civic/ResultsSkeleton";
import { useAskQuestion } from "@/hooks/useAskQuestion";
import { useRecentQuestions } from "@/hooks/useRecentQuestions";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Results() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") ?? "";
  const { status, query, explanation, error, ask } = useAskQuestion();
  const { add } = useRecentQuestions();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!q) { navigate("/"); return; }
    ask(q);
    add(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (status === "ready" && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [status]);

  function askNew(next: string) {
    navigate(`/results?q=${encodeURIComponent(next)}`);
  }

  const busy = status === "computing" || status === "explaining";

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="container max-w-5xl py-8 sm:py-12">
          <div className="no-print">
            <SearchBox onSubmit={askNew} loading={busy} initialValue={q} size="compact" />
          </div>

          <div ref={scrollRef} className="mt-8 space-y-6">
            {busy && <ResultsSkeleton stage={status === "computing" ? "computing" : "explaining"} />}

            {status === "error" && (
              <div className="surface-card p-6 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold">Couldn't answer that question</h3>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button size="sm" className="mt-4" onClick={() => ask(q)}>Try again</Button>
                </div>
              </div>
            )}

            {status === "ready" && query && explanation && (
              <>
                <ExecutiveSummary
                  paragraphs={explanation.summary}
                  question={q}
                  model={explanation.model}
                  latencyMs={explanation.latencyMs}
                />
                <InsightCards insights={query.insights} />
                <AutoChart spec={query.chart} />
                <EvidenceTable rows={query.evidence} />
                <FollowUps items={explanation.followUps} onPick={askNew} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
