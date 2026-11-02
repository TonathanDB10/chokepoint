import { cn } from "@/lib/utils";

interface Props {
  /** 0–max */
  value: number | null;
  max?: number;
  /** Colour semantics: "good" means higher is better, "bad" means higher is worse. */
  tone?: "good" | "bad" | "neutral";
  className?: string;
  showValue?: boolean;
  digits?: number;
}

export function ScoreBar({
  value,
  max = 5,
  tone = "neutral",
  className,
  showValue = true,
  digits = 1,
}: Props) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    value == null
      ? "bg-muted-foreground/30"
      : tone === "good"
        ? pct >= 75
          ? "bg-emerald-500"
          : pct >= 50
            ? "bg-emerald-400/80"
            : "bg-amber-400"
        : tone === "bad"
          ? pct >= 60
            ? "bg-rose-500"
            : pct >= 40
              ? "bg-amber-400"
              : "bg-emerald-500"
          : "bg-primary";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      {showValue && (
        <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
          {value == null ? "—" : value.toFixed(digits)}
        </span>
      )}
    </div>
  );
}
