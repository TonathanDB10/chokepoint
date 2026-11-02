import type { Quote, Stock, ThesisScores } from "./types";

export type FactorKey = keyof ThesisScores | "valuation";

export interface FactorWeights {
  bottleneckExposure: number;
  revenueSensitivity: number;
  moat: number;
  evidence: number;
  /** Weight on (5 − pricedIn): how much cheapness is rewarded. */
  valuation: number;
}

export const DEFAULT_WEIGHTS: FactorWeights = {
  bottleneckExposure: 20,
  revenueSensitivity: 20,
  moat: 20,
  evidence: 20,
  valuation: 20,
};

export const FACTOR_META: Record<
  FactorKey,
  { label: string; short: string; description: string }
> = {
  bottleneckExposure: {
    label: "Bottleneck exposure",
    short: "Bottleneck",
    description: "How directly the company owns the scarce component.",
  },
  revenueSensitivity: {
    label: "Revenue sensitivity",
    short: "Sensitivity",
    description: "How much of the P&L actually moves if the thesis is right.",
  },
  moat: {
    label: "Moat / pricing power",
    short: "Moat",
    description: "Switching costs, IP and process know-how that protect margins as volume grows.",
  },
  evidence: {
    label: "2027–29 evidence",
    short: "Evidence",
    description: "Backlog, guidance, supply agreements and capacity that show demand is real, not narrative.",
  },
  valuation: {
    label: "Not already priced in",
    short: "Valuation",
    description:
      "Inverse of the priced-in score: rewards names where the market has not yet paid for the story.",
  },
};

export interface PricedInComponent {
  key: "forwardPE" | "evToRevenue" | "growthAdjusted" | "nearHigh" | "targetUpside";
  label: string;
  value: number | null;
  display: string;
  /** 0–1 percentile within the universe; 1 = most expensive / most crowded. */
  percentile: number | null;
}

export interface Scored {
  stock: Stock;
  quote: Quote | undefined;
  /** 0–5 weighted average of the four qualitative factors. */
  thesisFit: number;
  /** 0–5, higher = more of the story already in the price. null if no data. */
  pricedIn: number | null;
  pricedInComponents: PricedInComponent[];
  /** 0–100 composite. */
  composite: number;
  rank: number;
  quadrant: Quadrant;
}

export type Quadrant =
  | "Underappreciated bottleneck"
  | "Crowded but right"
  | "Cheap for a reason"
  | "Avoid"
  | "No market data";

const fmtX = (v: number | null, d = 1) => (v == null ? "—" : `${v.toFixed(d)}x`);
const fmtPct = (v: number | null, d = 0) => (v == null ? "—" : `${(v * 100).toFixed(d)}%`);

function rawComponents(q: Quote | undefined): Omit<PricedInComponent, "percentile">[] {
  const price = q?.price ?? null;
  const fwdPE = q?.forwardPE ?? null;
  const evs = q?.evToRevenue ?? null;
  const growth = q?.revenueGrowth ?? null;
  const growthAdjusted =
    fwdPE != null && growth != null
      ? growth > 0.01
        ? fwdPE / (growth * 100)
        : 99
      : null;
  const nearHigh =
    price != null && q?.fiftyTwoWeekHigh ? price / q.fiftyTwoWeekHigh : null;
  const targetUpside =
    price != null && q?.targetMeanPrice ? q.targetMeanPrice / price - 1 : null;

  return [
    { key: "forwardPE", label: "Forward P/E", value: fwdPE, display: fmtX(fwdPE) },
    { key: "evToRevenue", label: "EV / Sales", value: evs, display: fmtX(evs) },
    {
      key: "growthAdjusted",
      label: "Fwd P/E ÷ revenue growth",
      value: growthAdjusted,
      display:
        growthAdjusted == null ? "—" : growthAdjusted >= 99 ? "n/a (no growth)" : growthAdjusted.toFixed(2),
    },
    {
      key: "nearHigh",
      label: "Price vs 52-week high",
      value: nearHigh,
      display: fmtPct(nearHigh),
    },
    {
      key: "targetUpside",
      label: "Upside to analyst target",
      value: targetUpside,
      display: targetUpside == null ? "—" : `${targetUpside >= 0 ? "+" : ""}${(targetUpside * 100).toFixed(0)}%`,
    },
  ];
}

/** Percentile of v within arr (0..1). Ties share the average rank. */
function percentile(v: number, arr: number[]): number {
  if (arr.length <= 1) return 0.5;
  const below = arr.filter((x) => x < v).length;
  const equal = arr.filter((x) => x === v).length;
  return (below + (equal - 1) / 2) / (arr.length - 1);
}

export function thesisFit(scores: ThesisScores, w: FactorWeights): number {
  const total = w.bottleneckExposure + w.revenueSensitivity + w.moat + w.evidence;
  if (total === 0) return 0;
  return (
    (scores.bottleneckExposure * w.bottleneckExposure +
      scores.revenueSensitivity * w.revenueSensitivity +
      scores.moat * w.moat +
      scores.evidence * w.evidence) /
    total
  );
}

export function quadrantFor(fit: number, pricedIn: number | null): Quadrant {
  if (pricedIn == null) return "No market data";
  const strong = fit >= 3.75;
  const crowded = pricedIn >= 2.5;
  if (strong && !crowded) return "Underappreciated bottleneck";
  if (strong && crowded) return "Crowded but right";
  if (!strong && !crowded) return "Cheap for a reason";
  return "Avoid";
}

/**
 * Score every stock in `stocks` against the whole universe. Percentiles for
 * the priced-in score are computed across all stocks passed in, so callers
 * should pass the full universe and filter afterwards.
 */
export function scoreUniverse(
  stocks: Stock[],
  quotes: Record<string, Quote>,
  weights: FactorWeights,
): Scored[] {
  const raws = stocks.map((s) => rawComponents(quotes[s.symbol]));
  const byKey = new Map<string, number[]>();
  raws.forEach((comps) =>
    comps.forEach((c) => {
      if (c.value != null) byKey.set(c.key, [...(byKey.get(c.key) ?? []), c.value]);
    }),
  );

  const scored = stocks.map((stock, i) => {
    const quote = quotes[stock.symbol];
    const comps: PricedInComponent[] = raws[i].map((c) => {
      if (c.value == null) return { ...c, percentile: null };
      const pool = byKey.get(c.key) ?? [];
      let p = percentile(c.value, pool);
      // Analyst upside is inverted: more upside = less priced in.
      if (c.key === "targetUpside") p = 1 - p;
      return { ...c, percentile: p };
    });
    const available = comps.filter((c) => c.percentile != null);
    const pricedIn =
      available.length >= 2
        ? (available.reduce((a, c) => a + (c.percentile as number), 0) / available.length) * 5
        : null;
    const fit = thesisFit(stock.scores, weights);
    const valuationScore = pricedIn == null ? 2.5 : 5 - pricedIn;
    const totalW =
      weights.bottleneckExposure +
      weights.revenueSensitivity +
      weights.moat +
      weights.evidence +
      weights.valuation;
    const composite =
      totalW === 0
        ? 0
        : ((stock.scores.bottleneckExposure * weights.bottleneckExposure +
            stock.scores.revenueSensitivity * weights.revenueSensitivity +
            stock.scores.moat * weights.moat +
            stock.scores.evidence * weights.evidence +
            valuationScore * weights.valuation) /
            totalW /
            5) *
          100;
    return {
      stock,
      quote,
      thesisFit: fit,
      pricedIn,
      pricedInComponents: comps,
      composite,
      rank: 0,
      quadrant: quadrantFor(fit, pricedIn),
    } satisfies Scored;
  });

  // Rank within each theme.
  (["optical", "humanoid"] as const).forEach((theme) => {
    scored
      .filter((s) => s.stock.theme === theme)
      .sort((a, b) => b.composite - a.composite)
      .forEach((s, i) => (s.rank = i + 1));
  });

  return scored;
}
