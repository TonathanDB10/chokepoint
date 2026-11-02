"use client";

import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScoreBar } from "@/components/score-bar";
import { Sparkline } from "@/components/sparkline";
import { FACTOR_META, type Scored } from "@/lib/scoring";
import { THEMES } from "@/lib/universe";
import { fmtCompact, fmtMultiple, fmtPct, fmtPrice, fmtRatioPct, stars } from "@/lib/format";
import type { ThesisScores } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  scored: Scored | null;
  onClose: () => void;
}

const quadrantTone: Record<string, string> = {
  "Underappreciated bottleneck": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "Crowded but right": "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "Cheap for a reason": "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Avoid: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "No market data": "bg-muted text-muted-foreground",
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col rounded-lg border bg-muted/30 px-3 py-2">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function StockSheet({ scored, onClose }: Props) {
  const s = scored?.stock;
  const q = scored?.quote;
  const upside = q?.price && q.targetMeanPrice ? (q.targetMeanPrice / q.price - 1) * 100 : null;
  const drawdown = q?.price && q.fiftyTwoWeekHigh ? (q.price / q.fiftyTwoWeekHigh - 1) * 100 : null;

  return (
    <Sheet open={!!scored} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        {scored && s && (
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-5 p-5">
              <SheetHeader className="p-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <SheetTitle className="flex items-baseline gap-2 font-heading text-2xl tracking-tight">
                      {s.name}
                      <span className="font-mono text-sm font-normal text-muted-foreground">{s.ticker}</span>
                    </SheetTitle>
                    <SheetDescription>
                      {s.exchange} · {THEMES[s.theme].title} · thread rank #{s.threadRank}, model rank #
                      {scored.rank}
                    </SheetDescription>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {fmtPrice(q?.price, q?.currency)}
                    </span>
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
                </div>
              </SheetHeader>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{s.tier}</Badge>
                <Badge className={cn("border-transparent", quadrantTone[scored.quadrant])}>{scored.quadrant}</Badge>
                {s.carryForward ? (
                  <Badge variant="secondary">Carried forward in thread</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Thread leaned toward dropping
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Past year, weekly closes</span>
                  <span className="text-xs text-muted-foreground">
                    52w range {fmtPrice(q?.fiftyTwoWeekLow, q?.currency)} – {fmtPrice(q?.fiftyTwoWeekHigh, q?.currency)}
                  </span>
                </div>
                <Sparkline data={q?.sparkline ?? []} width={200} height={48} />
              </div>

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">What it controls</h3>
                <p className="text-sm text-muted-foreground">{s.bottleneck}</p>
                <p className="text-sm leading-relaxed">{s.thesis}</p>
              </section>

              <Separator />

              <section className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">Thesis factors</h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    fit {scored.thesisFit.toFixed(2)} / 5
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(Object.keys(s.scores) as (keyof ThesisScores)[]).map((k) => (
                    <div key={k} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
                      <span className="text-sm">{FACTOR_META[k].short}</span>
                      <span className="font-mono text-xs text-amber-500">{stars(s.scores[k])}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold">How much is already priced in</h3>
                  <span className="font-mono text-xs text-muted-foreground">
                    {scored.pricedIn == null ? "—" : `${scored.pricedIn.toFixed(2)} / 5`}
                  </span>
                </div>
                <div className="flex flex-col divide-y rounded-md border">
                  {scored.pricedInComponents.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="text-sm text-muted-foreground">{c.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm tabular-nums">{c.display}</span>
                        <ScoreBar
                          value={c.percentile == null ? null : c.percentile * 5}
                          tone="bad"
                          showValue={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Each bar is the percentile of that metric across all 14 names; the priced-in score is
                  their average. It is a crowding gauge, not a fair-value estimate.
                </p>
              </section>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="Market cap" value={fmtCompact(q?.marketCap, q?.currency)} />
                <Stat label="Fwd P/E" value={fmtMultiple(q?.forwardPE)} sub={`trailing ${fmtMultiple(q?.trailingPE)}`} />
                <Stat label="EV / Sales" value={fmtMultiple(q?.evToRevenue)} sub={`EV/EBITDA ${fmtMultiple(q?.evToEbitda)}`} />
                <Stat label="Revenue growth" value={fmtRatioPct(q?.revenueGrowth, 0, true)} sub="latest quarter, YoY" />
                <Stat
                  label="Margins"
                  value={fmtRatioPct(q?.operatingMargins, 0)}
                  sub={`gross ${fmtRatioPct(q?.grossMargins, 0)}`}
                />
                <Stat label="vs 52w high" value={fmtPct(drawdown, 0)} />
                <Stat
                  label="Analyst target"
                  value={fmtPrice(q?.targetMeanPrice, q?.currency)}
                  sub={upside == null ? undefined : `${fmtPct(upside, 0, true)} · ${q?.analystCount ?? "—"} analysts`}
                />
                <Stat label="Consensus" value={(q?.recommendationKey ?? "—").replace("_", " ")} />
                <Stat label="PEG" value={q?.pegRatio == null ? "—" : q.pegRatio.toFixed(2)} />
              </div>

              <Separator />

              <section className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">Evidence cited</h3>
                <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed">
                  {s.evidence.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </section>

              <section className="flex flex-col gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">Key risk</h3>
                <p className="text-sm leading-relaxed">{s.risk}</p>
              </section>

              <a
                href={`https://finance.yahoo.com/quote/${encodeURIComponent(s.symbol)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Open on Yahoo Finance <ExternalLink className="size-3" />
              </a>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
