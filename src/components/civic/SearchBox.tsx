import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (q: string) => void;
  loading?: boolean;
  autoFocus?: boolean;
  initialValue?: string;
  size?: "hero" | "compact";
}

export function SearchBox({ onSubmit, loading, autoFocus, initialValue = "", size = "hero" }: Props) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  // Global "/" shortcut to focus.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit() {
    const q = value.trim();
    if (!q || loading) return;
    onSubmit(q);
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      className={cn(
        "group relative w-full mx-auto surface-card transition-all",
        size === "hero" ? "max-w-3xl p-2" : "max-w-full p-1.5",
        "focus-within:shadow-glow",
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Search className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
          }}
          rows={size === "hero" ? 2 : 1}
          placeholder="Ask anything about Washington State public spending…"
          className={cn(
            "flex-1 resize-none bg-transparent outline-none placeholder:text-muted-foreground",
            size === "hero" ? "text-lg" : "text-base",
          )}
          aria-label="Ask a question"
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className={cn(
            "shrink-0 grid place-items-center rounded-xl bg-primary text-primary-foreground h-11 w-11 transition",
            "hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft",
          )}
          aria-label="Ask"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
        </button>
      </div>
      {size === "hero" && (
        <div className="px-4 pb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60">/</kbd> to focus, <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60">Enter</kbd> to ask</span>
          <span>Backed by public data</span>
        </div>
      )}
    </form>
  );
}
