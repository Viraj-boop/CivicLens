import type { KeyInsights } from "@/types/spending";
import { formatCurrency, formatExactCurrency, formatPercent } from "@/lib/format";
import { TrendingUp, TrendingDown, Landmark, Store, Layers, Coins, Wallet, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  Icon: LucideIcon;
  tone?: "default" | "success" | "warning" | "danger";
}

function Card({ label, value, sub, Icon, tone = "default" }: CardProps) {
  const toneMap = {
    default: "text-primary bg-primary-soft",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    danger: "text-destructive bg-destructive/10",
  } as const;
  return (
    <div className="surface-card p-5 animate-in-up">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <div className={`h-8 w-8 rounded-xl grid place-items-center ${toneMap[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground line-clamp-1">{sub}</div>}
    </div>
  );
}

export function InsightCards({ insights }: { insights: KeyInsights }) {
  const yoy = insights.yoyDifference;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Card label="Total spending" value={formatCurrency(insights.totalSpending)} sub={`${insights.paymentCount.toLocaleString()} payments`} Icon={Coins} />
      <Card label="Largest vendor" value={insights.largestVendor ? formatCurrency(insights.largestVendor.amount) : "—"} sub={insights.largestVendor?.name} Icon={Store} />
      <Card label="Largest agency" value={insights.largestAgency ? formatCurrency(insights.largestAgency.amount) : "—"} sub={insights.largestAgency?.name} Icon={Landmark} />
      <Card label="Largest category" value={insights.largestCategory ? formatCurrency(insights.largestCategory.amount) : "—"} sub={insights.largestCategory?.name} Icon={Layers} />
      <Card label="Average payment" value={formatCurrency(insights.averagePayment)} Icon={Wallet} />
      <Card
        label="Largest single payment"
        value={insights.largestSinglePayment ? formatCurrency(insights.largestSinglePayment.amount) : "—"}
        sub={insights.largestSinglePayment ? `${insights.largestSinglePayment.vendor} · ${insights.largestSinglePayment.date}` : undefined}
        Icon={Zap}
        tone="warning"
      />
      {yoy ? (
        <Card
          label={`FY${yoy.fromYear} → FY${yoy.toYear}`}
          value={`${yoy.delta >= 0 ? "+" : ""}${formatCurrency(yoy.delta)}`}
          sub={formatPercent(yoy.percent)}
          Icon={yoy.delta >= 0 ? TrendingUp : TrendingDown}
          tone={yoy.delta >= 0 ? "success" : "danger"}
        />
      ) : (
        <Card label="YoY change" value="—" Icon={TrendingUp} />
      )}
      <Card label="Exact total" value={formatExactCurrency(insights.totalSpending)} Icon={Coins} />
    </div>
  );
}
