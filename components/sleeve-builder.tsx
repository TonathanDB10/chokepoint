"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Scored } from "@/lib/scoring";
import { fmtPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  rows: Scored[];
  sleeveUsd: number;
  onSleeveChange: (v: number) => void;
  weights: Record<string, number>;
  onWeightsChange: (w: Record<string, number>) => void;
  usdJpy: number | null;
  note: string;
}

const usd = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export function SleeveBuilder({
  rows,
  sleeveUsd,
  onSleeveChange,
  weights,
  onWeightsChange,
  usdJpy,
  note,
}: Props) {
  const sorted = [...rows].sort((a, b) => a.rank - b.rank);
  const total = sorted.reduce((a, r) => a + (weights[r.stock.symbol] ?? 0), 0);
  const balanced = Math.abs(total - 100) < 0.01;

  const setPreset = (mode: "thread" | "score" | "equal" | "carry") => {
    const next: Record<string, number> = {};
    if (mode === "thread") {
      sorted.forEach((r) => (next[r.stock.symbol] = r.stock.provisionalWeight));
    } else if (mode === "equal") {
      const w = 100 / sorted.length;
      sorted.forEach((r) => (next[r.stock.symbol] = Math.round(w * 10) / 10));
    } else if (mode === "carry") {
      const keep = sorted.filter((r) => r.stock.carryForward);
      const w = 100 / keep.length;
      sorted.forEach((r) => (next[r.stock.symbol] = r.stock.carryForward ? Math.round(w * 10) / 10 : 0));
    } else {
      // Proportional to composite score, squared so the ranking is expressed with conviction.
      const sum = sorted.reduce((a, r) => a + r.composite ** 2, 0);
      sorted.forEach((r) => (next[r.stock.symbol] = Math.round(((r.composite ** 2) / sum) * 1000) / 10));
    }
    // Absorb rounding drift into the largest position so the sleeve sums to 100.
    const drift = 100 - Object.values(next).reduce((a, b) => a + b, 0);
    const largest = Object.entries(next).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (largest) next[largest] = Math.round((next[largest] + drift) * 10) / 10;
    onWeightsChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sleeve" className="text-sm font-medium">
            Test sleeve size (USD)
          </label>
          <Input
            id="sleeve"
            type="number"
            min={0}
            step={1000}
            value={sleeveUsd}
            onChange={(e) => onSleeveChange(Number(e.target.value) || 0)}
            className="w-40 font-mono"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPreset("thread")}>
            Thread weights
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("score")}>
            Score-weighted
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("carry")}>
            Carry-forward only
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPreset("equal")}>
            Equal weight
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{note}</p>

      <div className="overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Company</TableHead>
              <TableHead className="w-28 text-right">Weight %</TableHead>
              <TableHead className="text-right">Allocation</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((r) => {
              const w = weights[r.stock.symbol] ?? 0;
              const alloc = (sleeveUsd * w) / 100;
              const q = r.quote;
              let shares: number | null = null;
              if (q?.price) {
                const localAlloc = q.currency === "JPY" ? (usdJpy ? alloc * usdJpy : null) : alloc;
                shares = localAlloc == null ? null : Math.floor(localAlloc / q.price);
              }
              return (
                <TableRow key={r.stock.symbol}>
                  <TableCell>
                    <span className="font-semibold">{r.stock.ticker}</span>{" "}
                    <span className="text-muted-foreground">{r.stock.name}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={w}
                      onChange={(e) =>
                        onWeightsChange({ ...weights, [r.stock.symbol]: Math.max(0, Number(e.target.value) || 0) })
                      }
                      aria-label={`${r.stock.ticker} weight`}
                      className="ml-auto h-8 w-24 text-right font-mono"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{usd(alloc)}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums">
                    {fmtPrice(q?.price, q?.currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {shares == null ? "—" : shares.toLocaleString()}
                    {q?.currency === "JPY" && usdJpy && (
                      <span className="block text-[11px] text-muted-foreground">@ ¥{usdJpy.toFixed(1)}/$</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{r.composite.toFixed(0)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono tabular-nums",
                  !balanced && "text-amber-600 dark:text-amber-400",
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {!balanced && <AlertTriangle className="size-3.5" />}
                  {total.toFixed(1)}%
                </span>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{usd((sleeveUsd * total) / 100)}</TableCell>
              <TableCell colSpan={3} className="text-right text-xs text-muted-foreground">
                {balanced ? "Fully allocated" : `${(100 - total).toFixed(1)}% ${total < 100 ? "unallocated" : "over-allocated"}`}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
