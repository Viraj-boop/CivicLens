export function ResultsSkeleton({ stage }: { stage: "computing" | "explaining" }) {
  return (
    <div className="space-y-6 animate-in-up">
      <div className="surface-card p-8">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {stage === "computing" ? "Computing statistics from public data…" : "Generating plain-English explanation…"}
        </div>
        <div className="mt-4 h-8 w-2/3 rounded-lg shimmer" />
        <div className="mt-4 space-y-2 max-w-2xl">
          <div className="h-3 rounded shimmer" />
          <div className="h-3 rounded shimmer w-11/12" />
          <div className="h-3 rounded shimmer w-4/5" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (<div key={i} className="surface-card p-5"><div className="h-3 w-24 rounded shimmer" /><div className="mt-4 h-6 w-32 rounded shimmer" /></div>))}
      </div>
      <div className="surface-card p-5"><div className="h-72 rounded shimmer" /></div>
    </div>
  );
}
