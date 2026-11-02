import type { Quote } from "./types";

// Yahoo throttles full browser UA strings from server IPs; the short form passes.
const UA = "Mozilla/5.0";

interface Session {
  cookie: string;
  crumb: string;
  createdAt: number;
}

let session: Session | null = null;
let sessionInFlight: Promise<Session> | null = null;
const SESSION_TTL_MS = 30 * 60 * 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch with retry on 429/5xx. Yahoo throttles bursts aggressively. */
async function fetchWithRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, init);
    if (res.status !== 429 && res.status < 500) return res;
    last = res;
    await sleep(600 * 2 ** i + Math.random() * 300);
  }
  return last as Response;
}

/**
 * Yahoo's quoteSummary endpoint requires a session cookie plus a matching
 * "crumb" token. Both are obtained anonymously; we cache them for 30 minutes
 * and share a single in-flight request so a burst of symbols does not trigger
 * a burst of crumb lookups.
 */
async function getSession(): Promise<Session> {
  if (session && Date.now() - session.createdAt < SESSION_TTL_MS) return session;
  if (sessionInFlight) return sessionInFlight;

  sessionInFlight = (async () => {
    const seed = await fetchWithRetry("https://fc.yahoo.com", {
      headers: { "User-Agent": UA },
      redirect: "manual",
      cache: "no-store",
    });
    const setCookies = seed.headers.getSetCookie?.() ?? [];
    const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    if (!cookie) throw new Error("Yahoo did not return a session cookie");

    const crumbRes = await fetchWithRetry(
      "https://query2.finance.yahoo.com/v1/test/getcrumb",
      { headers: { "User-Agent": UA, Cookie: cookie }, cache: "no-store" },
    );
    const crumb = (await crumbRes.text()).trim();
    if (!crumbRes.ok || !crumb || crumb.includes("<")) {
      throw new Error(`Yahoo crumb request failed (${crumbRes.status})`);
    }
    session = { cookie, crumb, createdAt: Date.now() };
    return session;
  })().finally(() => {
    sessionInFlight = null;
  });
  return sessionInFlight;
}

/** Run tasks with bounded concurrency, preserving order of results. */
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i]) };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

type Raw = { raw?: number } | number | null | undefined;
const num = (v: Raw): number | null => {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  return typeof v.raw === "number" && Number.isFinite(v.raw) ? v.raw : null;
};

async function fetchSummary(symbol: string): Promise<Partial<Quote>> {
  const { cookie, crumb } = await getSession();
  const modules = "price,summaryDetail,defaultKeyStatistics,financialData";
  const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
    symbol,
  )}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetchWithRetry(url, {
    headers: { "User-Agent": UA, Cookie: cookie },
    cache: "no-store",
  });
  if (res.status === 401) {
    session = null;
    throw new Error(`Yahoo session rejected for ${symbol}`);
  }
  if (!res.ok) throw new Error(`quoteSummary ${symbol} failed (${res.status})`);
  const json = await res.json();
  const r = json?.quoteSummary?.result?.[0];
  if (!r) throw new Error(`quoteSummary ${symbol} returned no result`);
  const p = r.price ?? {};
  const sd = r.summaryDetail ?? {};
  const ks = r.defaultKeyStatistics ?? {};
  const fd = r.financialData ?? {};
  return {
    currency: p.currency ?? null,
    price: num(p.regularMarketPrice),
    changePct:
      num(p.regularMarketChangePercent) != null
        ? (num(p.regularMarketChangePercent) as number) * 100
        : null,
    marketCap: num(p.marketCap),
    forwardPE: num(sd.forwardPE),
    trailingPE: num(sd.trailingPE),
    pegRatio: num(ks.pegRatio),
    evToRevenue: num(ks.enterpriseToRevenue),
    evToEbitda: num(ks.enterpriseToEbitda),
    revenueGrowth: num(fd.revenueGrowth),
    grossMargins: num(fd.grossMargins),
    operatingMargins: num(fd.operatingMargins),
    targetMeanPrice: num(fd.targetMeanPrice),
    recommendationKey: fd.recommendationKey ?? null,
    analystCount: num(fd.numberOfAnalystOpinions),
    fiftyTwoWeekHigh: num(sd.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(sd.fiftyTwoWeekLow),
    marketTime: num(p.regularMarketTime),
  };
}

async function fetchChart(symbol: string): Promise<Partial<Quote>> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=1y&interval=1wk`;
  const res = await fetchWithRetry(url, { headers: { "User-Agent": UA }, cache: "no-store" });
  if (!res.ok) throw new Error(`chart ${symbol} failed (${res.status})`);
  const json = await res.json();
  const r = json?.chart?.result?.[0];
  if (!r) throw new Error(`chart ${symbol} returned no result`);
  const closes: (number | null)[] = r.indicators?.quote?.[0]?.close ?? [];
  const sparkline = closes.filter((c): c is number => typeof c === "number");
  const meta = r.meta ?? {};
  return {
    sparkline,
    currency: meta.currency ?? null,
    price: num(meta.regularMarketPrice),
    changePct: num(meta.regularMarketChangePercent),
    fiftyTwoWeekHigh: num(meta.fiftyTwoWeekHigh),
    fiftyTwoWeekLow: num(meta.fiftyTwoWeekLow),
    marketTime: num(meta.regularMarketTime),
  };
}

export const EMPTY_QUOTE: Quote = {
  symbol: "",
  currency: null,
  price: null,
  changePct: null,
  marketCap: null,
  forwardPE: null,
  trailingPE: null,
  pegRatio: null,
  evToRevenue: null,
  evToEbitda: null,
  revenueGrowth: null,
  grossMargins: null,
  operatingMargins: null,
  targetMeanPrice: null,
  recommendationKey: null,
  analystCount: null,
  fiftyTwoWeekHigh: null,
  fiftyTwoWeekLow: null,
  sparkline: [],
  marketTime: null,
};

/**
 * Fetch a full quote for one symbol. The chart call is the more reliable of
 * the two, so it fills in price fields if quoteSummary fails.
 */
export async function fetchQuote(
  symbol: string,
): Promise<{ quote: Quote; errors: string[] }> {
  const errors: string[] = [];
  const [summary, chart] = await Promise.allSettled([
    fetchSummary(symbol),
    fetchChart(symbol),
  ]);
  const s = summary.status === "fulfilled" ? summary.value : {};
  const c = chart.status === "fulfilled" ? chart.value : {};
  if (summary.status === "rejected") errors.push(String(summary.reason?.message ?? summary.reason));
  if (chart.status === "rejected") errors.push(String(chart.reason?.message ?? chart.reason));
  if (summary.status === "rejected" && chart.status === "rejected") {
    throw new Error(errors.join("; "));
  }
  const quote: Quote = {
    ...EMPTY_QUOTE,
    ...c,
    ...Object.fromEntries(Object.entries(s).filter(([, v]) => v != null)),
    symbol,
    sparkline: c.sparkline ?? [],
  };
  return { quote, errors };
}
