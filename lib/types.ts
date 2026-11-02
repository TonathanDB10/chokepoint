export type ThemeId = "optical" | "humanoid";

export type Tier =
  | "Bottleneck owner"
  | "Architecture owner"
  | "Enabler"
  | "Quality infrastructure"
  | "Diluted exposure";

/** Qualitative 0–5 scores carried over from the thesis discussion. */
export interface ThesisScores {
  /** How directly the company owns the scarce thing (lasers, magnets, reducers…). */
  bottleneckExposure: number;
  /** How much of revenue/earnings actually moves if the thesis plays out. */
  revenueSensitivity: number;
  /** Durability of the position: switching costs, IP, process know-how. */
  moat: number;
  /** Hard evidence of 2027–29 demand: backlog, guidance, contracts, capacity. */
  evidence: number;
}

export interface Stock {
  /** Yahoo Finance symbol, e.g. "LITE" or "6324.T". */
  symbol: string;
  /** Short display ticker, e.g. "LITE" or "6324 JP". */
  ticker: string;
  name: string;
  theme: ThemeId;
  tier: Tier;
  exchange: string;
  currency: "USD" | "JPY";
  /** One-line description of what the company controls in the chain. */
  bottleneck: string;
  /** Rank assigned in the source discussion (1 = strongest). */
  threadRank: number;
  /** Provisional test-sleeve weight in percent. */
  provisionalWeight: number;
  scores: ThesisScores;
  thesis: string;
  evidence: string[];
  risk: string;
  /** Whether the discussion flagged this name to carry forward. */
  carryForward: boolean;
}

export interface Theme {
  id: ThemeId;
  title: string;
  subtitle: string;
  question: string;
  chain: string[];
  sleeveNote: string;
}

export interface Quote {
  symbol: string;
  currency: string | null;
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
  forwardPE: number | null;
  trailingPE: number | null;
  pegRatio: number | null;
  evToRevenue: number | null;
  evToEbitda: number | null;
  revenueGrowth: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  targetMeanPrice: number | null;
  recommendationKey: string | null;
  analystCount: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  /** Weekly closes over the past year, oldest first. */
  sparkline: number[];
  marketTime: number | null;
}

export interface QuotesResponse {
  source: "live" | "snapshot";
  fetchedAt: string;
  /** JPY per USD. */
  usdJpy: number | null;
  quotes: Record<string, Quote>;
  errors?: string[];
}
