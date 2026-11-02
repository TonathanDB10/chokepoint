"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ScoreBar } from "@/components/score-bar";
import { Sparkline } from "@/components/sparkline";
import type { Scored } from "@/lib/scoring";
import { fmtCompact, fmtMultiple, fmtPct, fmtPrice, fmtRatioPct } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  rows: Scored[];
  loading: boolean;
  onSelect: (symbol: string) => void;
}

const tierTone: Record<string, string> = {
  "Bottleneck owner": "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
  "Architecture owner": "border-sky-500/40 text-sky-700 dark:text-sky-300",
  Enabler: "border-violet-500/40 text-violet-700 dark:text-violet-300",
  "Quality infrastructure": "border-amber-500/40 text-amber-700 dark:text-amber-300",
  "Diluted exposure": "border-muted-foreground/40 text-muted-foreground",
};

function RankDelta({ from, to }: { from: number; to: number }) {
  const d = from - to;
  if (d === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-muted-foreground">
        <Minus className="size-3" />
        <span className="font-mono text-xs">#{from}</span>
      </span>
    );
  const up = d > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-xs",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      )}
    >
      {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      was #{from}
    </span>
  );
}

export function RankingTable({ rows, loading, onSelect }: Props) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[1040px]">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Bottleneck</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Mkt cap</TableHead>
            <TableHead className="text-right" title="Forward price / earnings">
              Fwd P/E
            </TableHead>
            <TableHead className="text-right" title="Enterprise value / trailing revenue">
              EV/S
            </TableHead>
            <TableHead className="text-right" title="Trailing-quarter revenue growth, year on year">
              Rev g.
            </TableHead>
            <TableHead className="text-right" title="Distance from 52-week high">
              vs 52w hi
            </TableHead>
            <TableHead title="Weighted average of the four qualitative thesis factors (0–5)">
              Thesis fit
            </TableHead>
            <TableHead title="How much of the story the market has already paid for (0–5, higher = more crowded)">
              Priced in
            </TableHead>
            <TableHead className="text-right" title="Composite score (0–100) after your factor weights">
              Score
            </TableHead>
            <TableHead className="text-right">1y</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const q = r.quote;
            const drawdown =
              q?.price != null && q.fiftyTwoWeekHigh ? (q.price / q.fiftyTwoWeekHigh - 1) * 100 : null;
            return (
              <TableRow
                key={r.stock.symbol}
                className="cursor-pointer"
                onClick={() => onSelect(r.stock.symbol)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(r.stock.symbol);
                  }
                }}
              >
                <TableCell className="font-mono text-sm tabular-nums">{r.rank}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.stock.ticker}</span>
                      <span className="text-muted-foreground">{r.stock.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={cn("h-5 text-[11px]", tierTone[r.stock.tier])}>
                        {r.stock.tier}
                      </Badge>
                      <RankDelta from={r.stock.threadRank} to={r.rank} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[240px] text-sm whitespace-normal text-muted-foreground">
                  {r.stock.bottleneck}
                </TableCell>
                <TableCell className="text-right">
                  {loading && !q ? (
                    <Skeleton className="ml-auto h-4 w-16" />
                  ) : (
                    <div className="flex flex-col items-end">
                      <span className="font-mono tabular-nums">{fmtPrice(q?.price, q?.currency)}</span>
                      <span
                        className={cn(
                          "font-mono text-xs tabular-nums",
                          (q?.changePct ?? 0) >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        {fmtPct(q?.changePct, 2, true)}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {fmtCompact(q?.marketCap, q?.currency)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {fmtMultiple(q?.forwardPE)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {fmtMultiple(q?.evToRevenue)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {fmtRatioPct(q?.revenueGrowth, 0, true)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono text-sm tabular-nums",
                    drawdown != null && drawdown <= -30 && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {fmtPct(drawdown, 0)}
                </TableCell>
                <TableCell>
                  <ScoreBar value={r.thesisFit} tone="good" />
                </TableCell>
                <TableCell>
                  <ScoreBar value={r.pricedIn} tone="bad" />
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-base font-semibold tabular-nums">
                    {r.composite.toFixed(0)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Sparkline data={q?.sparkline ?? []} className="ml-auto" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
