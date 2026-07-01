import { ChevronRight } from "lucide-react";

interface Props {
  items: string[];
  onPick: (q: string) => void;
}

export function FollowUps({ items, onPick }: Props) {
  if (!items.length) return null;
  return (
    <div className="surface-card p-5 animate-in-up">
      <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">Suggested follow-ups</h3>
      <ul className="flex flex-col divide-y divide-border/60 -my-2">
        {items.map((q) => (
          <li key={q}>
            <button
              onClick={() => onPick(q)}
              className="w-full py-3 flex items-center justify-between text-left group"
            >
              <span className="text-sm group-hover:text-primary transition">{q}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
