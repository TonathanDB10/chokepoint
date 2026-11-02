"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_WEIGHTS, FACTOR_META, type FactorKey, type FactorWeights } from "@/lib/scoring";

interface Props {
  weights: FactorWeights;
  onChange: (w: FactorWeights) => void;
}

const ORDER: FactorKey[] = ["bottleneckExposure", "revenueSensitivity", "moat", "evidence", "valuation"];

export function WeightControls({ weights, onChange }: Props) {
  const total = ORDER.reduce((a, k) => a + weights[k], 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {ORDER.map((k) => (
          <div key={k} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium">{FACTOR_META[k].label}</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {total ? Math.round((weights[k] / total) * 100) : 0}%
              </span>
            </div>
            <Slider
              min={0}
              max={40}
              step={1}
              value={[weights[k]]}
              onValueChange={(v) => {
                const n = Array.isArray(v) ? v[0] : (v as number);
                onChange({ ...weights, [k]: n });
              }}
              aria-label={FACTOR_META[k].label}
            />
            <p className="text-xs leading-snug text-muted-foreground">{FACTOR_META[k].description}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Sliders are relative: the composite score normalises them to 100%. Push valuation to zero to
          see the ranking on thesis merit alone; push it up to see who the market has not paid for yet.
        </p>
        <Button variant="outline" size="sm" onClick={() => onChange(DEFAULT_WEIGHTS)}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </div>
  );
}
