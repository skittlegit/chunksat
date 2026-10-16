"use client";

import { useAppStore } from "@/store/useAppStore";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint: string;
  onChange: (v: number) => void;
  decimals?: number;
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  hint,
  onChange,
  decimals = 1,
}: SliderRowProps) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="kbd">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="numeric text-[24px] leading-none text-[var(--phos)]">
            {value.toFixed(decimals)}
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
            {unit}
          </span>
        </div>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="relative z-10 w-full"
        />
        {/* phosphor fill behind track */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 z-0 h-[2px] -translate-y-1/2 bg-[var(--phos)]"
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="mono text-[9px] tabular-nums text-[var(--fg-ghost)]">
          {min.toFixed(decimals === 0 ? 0 : 1)}
        </span>
        <span className="text-[11px] italic text-[var(--fg-mute)]">{hint}</span>
        <span className="mono text-[9px] tabular-nums text-[var(--fg-ghost)]">
          {max.toFixed(decimals === 0 ? 0 : 1)}
        </span>
      </div>
    </div>
  );
}

export function ParameterSliders() {
  const settle = useAppStore((s) => s.settleMargin);
  const ona = useAppStore((s) => s.offNadirMargin);
  const setSettle = useAppStore((s) => s.setSettleMargin);
  const setOna = useAppStore((s) => s.setOffNadirMargin);

  return (
    <div className="grid grid-cols-1 gap-5">
      <SliderRow
        label="Settle margin"
        value={settle}
        min={0.1}
        max={1.5}
        step={0.1}
        unit="s"
        hint="buffer after slew · planner default 0.3"
        onChange={setSettle}
      />
      <SliderRow
        label="Off-nadir margin"
        value={ona}
        min={0}
        max={20}
        step={1}
        unit="deg"
        hint="headroom under 60° limit"
        onChange={setOna}
        decimals={0}
      />
    </div>
  );
}
