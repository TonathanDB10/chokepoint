"use client";

import {
  CartesianGrid,
  Label,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Scored } from "@/lib/scoring";

interface Props {
  rows: Scored[];
  onSelect: (symbol: string) => void;
}

interface Point {
  x: number;
  y: number;
  z: number;
  ticker: string;
  name: string;
  symbol: string;
  composite: number;
  quadrant: string;
}

function TooltipBody({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="font-semibold">
        {p.ticker} <span className="font-normal text-muted-foreground">{p.name}</span>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-3 font-mono tabular-nums">
        <span className="text-muted-foreground">Thesis fit</span>
        <span className="text-right">{p.y.toFixed(2)}</span>
        <span className="text-muted-foreground">Priced in</span>
        <span className="text-right">{p.x.toFixed(2)}</span>
        <span className="text-muted-foreground">Score</span>
        <span className="text-right">{p.composite.toFixed(0)}</span>
      </div>
      <div className="mt-1 text-muted-foreground">{p.quadrant}</div>
    </div>
  );
}

export function QuadrantChart({ rows, onSelect }: Props) {
  const points: Point[] = rows
    .filter((r) => r.pricedIn != null)
    .map((r) => ({
      x: r.pricedIn as number,
      y: r.thesisFit,
      z: r.composite,
      ticker: r.stock.ticker,
      name: r.stock.name,
      symbol: r.stock.symbol,
      composite: r.composite,
      quadrant: r.quadrant,
    }));

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <ReferenceArea x1={0} x2={2.5} y1={3.75} y2={5} fill="var(--color-emerald-500)" fillOpacity={0.07} />
          <ReferenceArea x1={2.5} x2={5} y1={3.75} y2={5} fill="var(--color-amber-500)" fillOpacity={0.06} />
          <ReferenceArea x1={2.5} x2={5} y1={0} y2={3.75} fill="var(--color-rose-500)" fillOpacity={0.05} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
          >
            <Label value="Already priced in →" position="bottom" offset={6} className="fill-muted-foreground text-xs" />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 11 }}
            width={32}
            className="fill-muted-foreground"
          >
            <Label
              value="Thesis fit →"
              angle={-90}
              position="insideLeft"
              offset={12}
              className="fill-muted-foreground text-xs"
            />
          </YAxis>
          <ReferenceLine x={2.5} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
          <ReferenceLine y={3.75} stroke="var(--color-muted-foreground)" strokeDasharray="4 4" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<TooltipBody />} />
          <Scatter
            data={points}
            fill="var(--color-primary)"
            onClick={(p) => onSelect((p as unknown as Point).symbol)}
            className="cursor-pointer"
            shape={(props: unknown) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: Point };
              const r = 6 + (payload.composite / 100) * 8;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={r} fill="var(--color-primary)" fillOpacity={0.85} />
                  <text
                    x={cx}
                    y={cy - r - 4}
                    textAnchor="middle"
                    className="fill-foreground font-mono text-[10px] font-semibold"
                  >
                    {payload.ticker}
                  </text>
                </g>
              );
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
