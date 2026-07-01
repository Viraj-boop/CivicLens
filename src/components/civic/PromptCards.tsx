import { Sparkles } from "lucide-react";

const PROMPTS = [
  { icon: "💰", text: "Who received the most money from Washington State?" },
  { icon: "🏛️", text: "Which agencies spend the most?" },
  { icon: "📊", text: "Compare FY2022 and FY2023 spending" },
  { icon: "🚧", text: "Explain transportation spending" },
  { icon: "🔍", text: "Find unusual vendor payments" },
];

interface Props {
  onPick: (q: string) => void;
}

export function PromptCards({ onPick }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {PROMPTS.map((p) => (
        <button
          key={p.text}
          onClick={() => onPick(p.text)}
          className="group text-left surface-card p-4 hover:shadow-glow hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl leading-none">{p.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium leading-snug">{p.text}</p>
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Ask this
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
