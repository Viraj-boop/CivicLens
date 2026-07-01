import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Scatter, ScatterChart, Tooltip, Treemap, XAxis, YAxis,
} from "recharts";
import type { ChartSpec } from "@/types/spending";
import { formatCurrency } from "@/lib/format";

const COLORS = [
  "hsl(221 83% 53%)",
  "hsl(152 71% 40%)",
  "hsl(38 92% 50%)",
  "hsl(350 89% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(24 95% 53%)",
  "hsl(291 64% 52%)",
  "hsl(174 72% 40%)",
  "hsl(340 82% 55%)",
];

const tick = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

function TooltipContent({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: { name?: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item.payload?.name ?? item.name ?? "";
  return (
    <div className="surface-card px-3 py-2 text-xs">
      <div className="font-medium">{name}</div>
      <div className="text-muted-foreground tabular-nums">{formatCurrency(Number(item.value ?? 0))}</div>
    </div>
  );
}

export function AutoChart({ spec }: { spec: ChartSpec }) {
  return (
    <div className="surface-card p-5 animate-in-up">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{spec.title}</h3>
      <div className="mt-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(spec)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(spec: ChartSpec) {
  switch (spec.type) {
    case "bar":
      return (
        <BarChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={spec.xKey} tick={tick} interval={0} angle={-25} textAnchor="end" height={60} />
          <YAxis tick={tick} tickFormatter={(v) => formatCurrency(Number(v))} />
          <Tooltip content={<TooltipContent />} cursor={{ fill: "hsl(var(--muted))" }} />
          <Bar dataKey={spec.yKey} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={spec.xKey} tick={tick} />
          <YAxis tick={tick} tickFormatter={(v) => formatCurrency(Number(v))} />
          <Tooltip content={<TooltipContent />} />
          <Line type="monotone" dataKey={spec.yKey} stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      );
    case "area":
      return (
        <AreaChart data={spec.data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey={spec.xKey} tick={tick} />
          <YAxis tick={tick} tickFormatter={(v) => formatCurrency(Number(v))} />
          <Tooltip content={<TooltipContent />} />
          <Area type="monotone" dataKey={spec.yKey} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaFill)" />
        </AreaChart>
      );
    case "pie":
      return (
        <PieChart>
          <Tooltip content={<TooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Pie data={spec.data} dataKey={spec.yKey} nameKey={spec.xKey} outerRadius={110} innerRadius={60} paddingAngle={2}>
            {spec.data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      );
    case "treemap":
      return (
        <Treemap
          data={spec.data as Array<{ name: string; amount: number }>}
          dataKey={spec.yKey}
          stroke="hsl(var(--background))"
          fill="hsl(var(--primary))"
          content={<TreemapCell />}
        />
      );
    case "scatter":
      return (
        <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" dataKey={spec.xKey} tick={tick} name="Rank" />
          <YAxis type="number" dataKey={spec.yKey} tick={tick} tickFormatter={(v) => formatCurrency(Number(v))} />
          <Tooltip content={<TooltipContent />} cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={spec.data} fill="hsl(var(--warning))" />
        </ScatterChart>
      );
  }
}

// Custom treemap cell with label + tint by index.
function TreemapCell(props: unknown) {
  const p = props as { x: number; y: number; width: number; height: number; index: number; name?: string; amount?: number };
  const color = COLORS[p.index % COLORS.length];
  return (
    <g>
      <rect x={p.x} y={p.y} width={p.width} height={p.height} style={{ fill: color, stroke: "hsl(var(--background))", strokeWidth: 2 }} />
      {p.width > 70 && p.height > 30 && (
        <>
          <text x={p.x + 8} y={p.y + 20} fill="white" fontSize={12} fontWeight={600}>{p.name}</text>
          <text x={p.x + 8} y={p.y + 36} fill="white" fontSize={11} opacity={0.9}>{formatCurrency(Number(p.amount ?? 0))}</text>
        </>
      )}
    </g>
  );
}
