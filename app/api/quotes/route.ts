import type { NextRequest } from "next/server";
import { ALL_SYMBOLS, BENCHMARKS } from "@/lib/universe";
import { fetchQuote, mapLimit } from "@/lib/yahoo";
import type { Quote, QuotesResponse } from "@/lib/types";
import snapshotJson from "@/data/snapshot.json";

// Serverless hosts (Netlify, Vercel) do not ship arbitrary files with the
// function bundle, so the fallback snapshot is imported rather than read from disk.
const SNAPSHOT: QuotesResponse = { ...(snapshotJson as QuotesResponse), source: "snapshot" };

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 10 * 60 * 1000;
let cache: { at: number; data: QuotesResponse } | null = null;

async function loadSnapshot(): Promise<QuotesResponse | null> {
  return SNAPSHOT.quotes && Object.keys(SNAPSHOT.quotes).length ? SNAPSHOT : null;
}

async function fetchLive(): Promise<QuotesResponse> {
  const results = await mapLimit(ALL_SYMBOLS, 3, (s) => fetchQuote(s));
  const quotes: Record<string, Quote> = {};
  const errors: string[] = [];
  results.forEach((r, i) => {
    const symbol = ALL_SYMBOLS[i];
    if (r.status === "fulfilled") {
      quotes[symbol] = r.value.quote;
      errors.push(...r.value.errors);
    } else {
      errors.push(`${symbol}: ${String(r.reason?.message ?? r.reason)}`);
    }
  });

  const universeCount = ALL_SYMBOLS.length - 2;
  const got = Object.keys(quotes).filter(
    (s) => s !== BENCHMARKS.koid.symbol && s !== BENCHMARKS.usdJpy.symbol,
  ).length;
  // Treat a mostly-failed fetch as unusable so the snapshot fallback kicks in.
  if (got < universeCount / 2) {
    throw new Error(`Only ${got}/${universeCount} quotes fetched: ${errors.join("; ")}`);
  }

  return {
    source: "live",
    fetchedAt: new Date().toISOString(),
    usdJpy: quotes[BENCHMARKS.usdJpy.symbol]?.price ?? null,
    quotes,
    errors: errors.length ? errors : undefined,
  };
}

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("refresh") === "1";
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return Response.json(cache.data, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const data = await fetchLive();
    cache = { at: Date.now(), data };
    return Response.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    const snapshot = await loadSnapshot();
    if (snapshot) {
      return Response.json(
        {
          ...snapshot,
          errors: [
            `Live data unavailable: ${err instanceof Error ? err.message : String(err)}`,
            ...(snapshot.errors ?? []),
          ],
        } satisfies QuotesResponse,
        { headers: { "Cache-Control": "no-store" } },
      );
    }
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
