"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, RefreshCw, Radio, Archive, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RankingTable } from "@/components/ranking-table";
import { QuadrantChart } from "@/components/quadrant-chart";
import { StockSheet } from "@/components/stock-sheet";
import { WeightControls } from "@/components/weight-controls";
import { SleeveBuilder } from "@/components/sleeve-builder";
import { DEFAULT_WEIGHTS, scoreUniverse, type FactorWeights, type Scored } from "@/lib/scoring";
import { BENCHMARKS, THEMES, UNIVERSE } from "@/lib/universe";
import type { QuotesResponse, ThemeId } from "@/lib/types";
import { fmtMultiple, fmtPct, fmtPrice, relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type State =
  | { status: "loading"; data: QuotesResponse | null }
  | { status: "ready"; data: QuotesResponse }
  | { status: "error"; data: QuotesResponse | null; message: string };

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function initialSleeveWeights(theme: ThemeId): Record<string, number> {
  return Object.fromEntries(
    UNIVERSE.filter((s) => s.theme === theme).map((s) => [s.symbol, s.provisionalWeight]),
  );
}

export function Dashboard() {
  const [state, setState] = useState<State>({ status: "loading", data: null });
  const [theme, setTheme] = useState<ThemeId>("optical");
  const [weights, setWeights] = useState<FactorWeights>(DEFAULT_WEIGHTS);
  const [selected, setSelected] = useState<string | null>(null);
  const [sleeveUsd, setSleeveUsd] = useState(100_000);
  const [sleeveWeights, setSleeveWeights] = useState<Record<ThemeId, Record<string, number>>>({
    optical: initialSleeveWeights("optical"),
    humanoid: initialSleeveWeights("humanoid"),
  });

  const load = useCallback(async (refresh = false) => {
    setState((s) => ({ status: "loading", data: s.data }));
    try {
      const res = await fetch(`/api/quotes${refresh ? "?refresh=1" : ""}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const data = (await res.json()) as QuotesResponse;
      setState({ status: "ready", data });
    } catch (err) {
      setState((s) => ({
        status: "error",
        data: s.data,
        message: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quotes = useMemo(() => state.data?.quotes ?? {}, [state.data]);
  const scored = useMemo(() => scoreUniverse(UNIVERSE, quotes, weights), [quotes, weights]);
  const rows = useMemo(() => scored.filter((s) => s.stock.theme === theme), [scored, theme]);
  const selectedScored: Scored | null = selected ? scored.find((s) => s.stock.symbol === selected) ?? null : null;
  const t = THEMES[theme];
  const loading = state.status === "loading";
  const koid = quotes[BENCHMARKS.koid.symbol];

  const kpis = useMemo(() => {
    const withData = rows.filter((r) => r.quote?.price != null);
    return {
      fwdPE: median(withData.map((r) => r.quote?.forwardPE).filter((v): v is number => v != null)),
      evs: median(withData.map((r) => r.quote?.evToRevenue).filter((v): v is number => v != null)),
      drawdown: median(
        withData
          .map((r) =>
            r.quote?.price && r.quote.fiftyTwoWeekHigh ? (r.quote.price / r.quote.fiftyTwoWeekHigh - 1) * 100 : null,
          )
          .filter((v): v is number => v != null),
      ),
      growth: median(withData.map((r) => r.quote?.revenueGrowth).filter((v): v is number => v != null)),
      underappreciated: rows.filter((r) => r.quadrant === "Underappreciated bottleneck"),
      crowded: rows.filter((r) => r.quadrant === "Crowded but right"),
    };
  }, [rows]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b pb-8 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Chokepoint · bottleneck thesis tester
          </p>
          <div className="flex items-center gap-2">
            <DataStatus state={state} />
            <Button variant="outline" size="sm" onClick={() => load(true)} disabled={loading}>
              <RefreshCw data-icon="inline-start" className={cn(loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="max-w-3xl">
          <h1 className="font-heading text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Don&rsquo;t buy the robot.
            <br />
            Find what it can&rsquo;t ship without.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Two bottleneck baskets, fourteen names. The thesis work said who benefits if the story is
            right. This screen asks the harder question the discussion stopped at:{" "}
            <span className="text-foreground">which of them is not already priced for it.</span>
          </p>
        </div>
      </header>

      {state.status === "error" && !state.data && (
        <Card className="border-rose-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <AlertCircle className="size-4" /> Market data unavailable
            </CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              The qualitative thesis scores still work without prices, but the priced-in screen and the
              sleeve builder need a quote feed. Yahoo Finance sometimes throttles bursts; retrying
              usually clears it.
            </p>
            <Button size="sm" onClick={() => load(true)}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      <ResearchTree active={theme} onPick={setTheme} />

      <Tabs value={theme} onValueChange={(v) => setTheme(v as ThemeId)}>
        <TabsList>
          <TabsTrigger value="optical">Optical Bottleneck</TabsTrigger>
          <TabsTrigger value="humanoid">Humanoid Bottleneck</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle className="font-heading text-2xl tracking-tight">{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <blockquote className="border-l-2 pl-3 text-sm leading-relaxed">{t.question}</blockquote>
            <div className="flex flex-wrap gap-2 text-xs">
              {kpis.underappreciated.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-700 dark:text-emerald-300">
                  Underappreciated: {kpis.underappreciated.map((r) => r.stock.ticker).join(", ")}
                </span>
              )}
              {kpis.crowded.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-amber-700 dark:text-amber-300">
                  Crowded but right: {kpis.crowded.map((r) => r.stock.ticker).join(", ")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Kpi label="Median fwd P/E" value={loading && !state.data ? null : fmtMultiple(kpis.fwdPE)} />
              <Kpi label="Median EV / Sales" value={loading && !state.data ? null : fmtMultiple(kpis.evs)} />
              <Kpi
                label="Median rev. growth"
                value={
                  loading && !state.data ? null : kpis.growth == null ? "—" : fmtPct(kpis.growth * 100, 0, true)
                }
              />
              <Kpi
                label="Median vs 52w high"
                value={loading && !state.data ? null : fmtPct(kpis.drawdown, 0)}
                hint={kpis.drawdown != null && kpis.drawdown < -20 ? "Basket is well off its highs" : undefined}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-tight">Thesis fit vs. priced in</CardTitle>
            <CardDescription>
              Top-left is where we want to find names: strong thesis, market not yet paying for it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.some((r) => r.pricedIn != null) ? (
              <QuadrantChart rows={rows} onSelect={setSelected} />
            ) : (
              <Skeleton className="h-[340px] w-full" />
            )}
            <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] text-muted-foreground">
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-emerald-500/60" />
                Underappreciated bottleneck
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-amber-500/60" />
                Crowded but right
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-muted-foreground/40" />
                Cheap for a reason
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-rose-500/60" />
                Avoid
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl tracking-tight">Ranking after the mispricing screen</CardTitle>
          <CardDescription>
            Sorted by composite score. &ldquo;was #n&rdquo; shows where the discussion had each name before
            valuation was considered. Click a row for the full case.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-2">
          <RankingTable rows={rows} loading={loading} onSelect={setSelected} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl tracking-tight">Factor weights</CardTitle>
          <CardDescription>
            The five tests the discussion defined: bottleneck exposure, revenue sensitivity, moat, 2027–29
            evidence, and how much is already priced in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WeightControls weights={weights} onChange={setWeights} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl tracking-tight">Test sleeve</CardTitle>
          <CardDescription>
            Size a paper sleeve to test the basket. Shares are rounded down at the last price; Tokyo names
            convert at the live USD/JPY rate.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SleeveBuilder
            rows={rows}
            sleeveUsd={sleeveUsd}
            onSleeveChange={setSleeveUsd}
            weights={sleeveWeights[theme]}
            onWeightsChange={(w) => setSleeveWeights((prev) => ({ ...prev, [theme]: w }))}
            usdJpy={state.data?.usdJpy ?? null}
            note={t.sleeveNote}
          />
        </CardContent>
      </Card>

      {theme === "humanoid" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl tracking-tight">Benchmark: just buy the ETF?</CardTitle>
            <CardDescription>
              The original post got its exposure through ONE-HUMANOID-X, a feeder into {BENCHMARKS.koid.name}{" "}
              ({BENCHMARKS.koid.symbol}): ~60 names, roughly equal-weighted, supply chain rather than robot
              OEMs.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Kpi label="KOID last" value={koid ? fmtPrice(koid.price, koid.currency) : null} />
            <Kpi
              label="KOID vs 52w high"
              value={
                koid?.price && koid.fiftyTwoWeekHigh ? fmtPct((koid.price / koid.fiftyTwoWeekHigh - 1) * 100, 0) : null
              }
            />
            <Kpi
              label="52w range"
              value={koid ? `${fmtPrice(koid.fiftyTwoWeekLow, "USD")} – ${fmtPrice(koid.fiftyTwoWeekHigh, "USD")}` : null}
            />
            <p className="text-xs text-muted-foreground sm:col-span-3">
              The seven-stock basket is a concentrated bet that the bottleneck sits in magnets, motion
              and reducers. If you are not confident in that call, the ETF is the honest default and the
              basket should be judged against it.
            </p>
          </CardContent>
        </Card>
      )}

      <footer className="flex flex-col gap-1 border-t pt-4 text-xs text-muted-foreground">
        <p>
          Research tool, not investment advice. Qualitative scores are editorial judgements transcribed
          from the thesis discussion; market data is from Yahoo Finance and may be delayed. Nothing here
          knows your tax situation, time horizon or risk budget.
        </p>
        {state.data?.errors?.length ? (
          <details>
            <summary className="cursor-pointer">Data warnings ({state.data.errors.length})</summary>
            <ul className="mt-1 list-disc pl-5">
              {state.data.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </details>
        ) : null}
      </footer>

      <StockSheet scored={selectedScored} onClose={() => setSelected(null)} />
    </div>
  );
}

function DataStatus({ state }: { state: State }) {
  if (state.status === "loading" && !state.data) {
    return (
      <Badge variant="outline" className="gap-1.5 font-normal">
        <RefreshCw className="size-3 animate-spin" /> Loading quotes
      </Badge>
    );
  }
  if (state.status === "error" && !state.data) {
    return (
      <Badge variant="destructive" className="gap-1.5 font-normal">
        <AlertCircle className="size-3" /> No data
      </Badge>
    );
  }
  const d = state.data!;
  const live = d.source === "live";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-normal",
        live ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300" : "border-amber-500/40 text-amber-700 dark:text-amber-300",
      )}
      title={live ? "Fetched live from Yahoo Finance" : "Live feed unavailable; showing the bundled snapshot"}
    >
      {live ? <Radio className="size-3" /> : <Archive className="size-3" />}
      {live ? "Live" : "Snapshot"} · {relativeTime(d.fetchedAt)}
    </Badge>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string | null; hint?: string }) {
  return (
    <Card className="gap-1 py-3">
      <CardContent className="flex flex-col gap-0.5 px-4">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
        {value == null ? (
          <Skeleton className="h-6 w-20" />
        ) : (
          <span className="font-mono text-lg font-semibold tabular-nums">{value}</span>
        )}
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </CardContent>
    </Card>
  );
}

function ResearchTree({ active, onPick }: { active: ThemeId; onPick: (t: ThemeId) => void }) {
  const branches: { id: ThemeId; root: string; steps: string[] }[] = [
    { id: "optical", root: "AI infrastructure", steps: THEMES.optical.chain },
    { id: "humanoid", root: "Physical AI", steps: THEMES.humanoid.chain },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {branches.map((b) => (
        <button
          key={b.id}
          type="button"
          onClick={() => onPick(b.id)}
          className={cn(
            "flex flex-wrap items-center gap-1 rounded-lg border px-3 py-2 text-left text-xs transition-colors hover:bg-muted/60",
            active === b.id ? "border-primary/50 bg-muted/40" : "border-border",
          )}
        >
          <span className="font-semibold">{b.root}</span>
          {b.steps.map((s, i) => (
            <span key={s} className="inline-flex items-center gap-1 text-muted-foreground">
              <ChevronRight className="size-3" />
              <span className={cn(i === b.steps.length - 1 && "font-semibold text-foreground")}>{s}</span>
            </span>
          ))}
        </button>
      ))}
    </div>
  );
}
