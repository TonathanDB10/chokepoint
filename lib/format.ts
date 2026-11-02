export function fmtPrice(v: number | null | undefined, currency: string | null | undefined): string {
  if (v == null) return "—";
  const cur = currency ?? "USD";
  const digits = cur === "JPY" ? 0 : v >= 1000 ? 0 : 2;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

export function fmtCompact(v: number | null | undefined, currency: string | null | undefined): string {
  if (v == null) return "—";
  const cur = currency ?? "USD";
  const symbol = cur === "JPY" ? "¥" : "$";
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${symbol}${(v / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${symbol}${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${symbol}${(v / 1e6).toFixed(0)}M`;
  return `${symbol}${v.toFixed(0)}`;
}

export function fmtMultiple(v: number | null | undefined, digits = 1): string {
  if (v == null) return "—";
  return `${v.toFixed(digits)}x`;
}

export function fmtPct(v: number | null | undefined, digits = 1, signed = false): string {
  if (v == null) return "—";
  const s = `${v.toFixed(digits)}%`;
  return signed && v > 0 ? `+${s}` : s;
}

export function fmtRatioPct(v: number | null | undefined, digits = 0, signed = false): string {
  if (v == null) return "—";
  return fmtPct(v * 100, digits, signed);
}

export function fmtScore(v: number | null | undefined, digits = 1): string {
  if (v == null) return "—";
  return v.toFixed(digits);
}

export function stars(v: number): string {
  const full = Math.floor(v);
  const half = v - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(5 - full - (half ? 1 : 0));
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
