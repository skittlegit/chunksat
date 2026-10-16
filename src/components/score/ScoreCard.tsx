"use client";

import type { ScoreBreakdown } from "@/lib/types";
import { S_ORBIT_MAX } from "@/lib/constants";

interface ScoreCardProps {
  score: ScoreBreakdown;
}

const COMPONENTS: { key: keyof ScoreBreakdown; full: string; sym: string }[] = [
  { key: "C", full: "Coverage", sym: "C" },
  { key: "eta_E", full: "Energy", sym: "η_E" },
  { key: "eta_T", full: "Time", sym: "η_T" },
  { key: "Q_smear", full: "Smear quality", sym: "Q" },
];

export function ScoreCard({ score }: ScoreCardProps) {
  const v = Number.isFinite(score.S_orbit) ? score.S_orbit : 0;
  // Bar fills the full track at the theoretical ceiling
  // S_orbit_max = 1.35 = (1 + 0.25 + 0.10). The numeric value is shown raw.
  const fill = Math.max(0, Math.min(1, v / S_ORBIT_MAX));

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Hero */}
      <div className="flex flex-col gap-2">
        <span className="kbd">S_orbit · per-case score</span>
        <div className="flex items-end gap-3">
          <span
            className="numeric leading-[0.85] text-[var(--phos)] text-[64px] sm:text-[88px]"
            style={{ letterSpacing: "-0.05em" }}
          >
            {v.toFixed(3)}
          </span>
          <div className="mb-1 flex flex-col text-[var(--fg-faint)]">
            <span className="mono text-[10px] uppercase tracking-[0.18em]">
              of {S_ORBIT_MAX.toFixed(2)}
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.18em]">
              {percentBand(v)}
            </span>
          </div>
        </div>
        {/* phosphor meter */}
        <div className="relative mt-1 h-[3px] w-full bg-[var(--line)]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 bg-[var(--phos)]"
            style={{
              width: `${fill * 100}%`,
              transition: "width 0.6s cubic-bezier(.2,.7,.2,1)",
            }}
          />
          {/* Marker at C=1.0 — the no-bonus baseline. */}
          <span
            aria-hidden
            className="absolute inset-y-[-3px] w-px bg-[var(--fg-faint)]"
            style={{ left: `${(1 / S_ORBIT_MAX) * 100}%` }}
            title="C = 1.0 (full coverage, no bonus)"
          />
        </div>
        {score.breakdown && (
          <p className="mt-1 text-[12px] italic leading-snug text-[var(--fg-mute)]">
            {score.breakdown}
          </p>
        )}
      </div>

      {/* Components */}
      <div className="grid grid-cols-2 gap-2">
        {COMPONENTS.map((it) => {
          const raw = score[it.key];
          const num =
            typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
          return (
            <div
              key={it.key}
              className="flex flex-col gap-2 border border-[var(--line)] bg-[var(--bg-sunk)] p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] text-[var(--fg-mute)]">{it.full}</span>
                <span className="mono text-[9px] tabular-nums tracking-[0.12em] text-[var(--fg-faint)]">
                  {it.sym}
                </span>
              </div>
              <span className="numeric text-[26px] leading-none text-[var(--fg)]">
                {num.toFixed(2)}
              </span>
              <div className="relative h-[2px] w-full bg-[var(--line)]">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 bg-[var(--fg)]"
                  style={{
                    width: `${Math.max(0, Math.min(1, num)) * 100}%`,
                    transition: "width 0.5s cubic-bezier(.2,.7,.2,1)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function percentBand(v: number) {
  // Bands relative to S_orbit_max = 1.35.
  if (v >= 1.20) return "BAND · A";
  if (v >= 1.05) return "BAND · B";
  if (v >= 0.85) return "BAND · C";
  if (v >= 0.50) return "BAND · D";
  return "BAND · F";
}
