"use client";

import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { FrameResult } from "@/lib/types";
import { cn } from "@/lib/cn";

const MAX_ROWS = 200;

const Gate = ({ ok }: { ok: boolean }) => (
  <span
    className="mono inline-block w-4 text-center text-[12px]"
    style={{ color: ok ? "var(--go)" : "var(--danger)" }}
  >
    {ok ? "✓" : "✗"}
  </span>
);

export function FrameTable({ frames }: { frames: FrameResult[] }) {
  const selectFrame = useAppStore((s) => s.selectFrame);
  const selectedFrameIndex = useAppStore((s) => s.selectedFrameIndex);

  const rows = useMemo(() => frames.slice(0, MAX_ROWS), [frames]);
  const truncated = frames.length > MAX_ROWS;

  if (!frames.length) {
    return (
      <p className="text-[13px] italic text-[var(--fg-mute)]">
        No frames simulated yet — initiate a pass to populate the table.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="kbd">
          showing {rows.length} of {frames.length} frames
        </span>
        {truncated && (
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--warn)]">
            Capped at {MAX_ROWS}
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-[var(--line)]">
        <table className="mono w-full border-collapse text-[11px]">
          <thead>
            <tr
              className="border-b border-[var(--line-bright)] bg-[var(--bg-sunk)] text-[var(--fg-faint)]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {[
                "#",
                "t (s)",
                "lat,lon",
                "ONA °",
                "ω °/s",
                "wheel",
                "smear",
                "ona",
                "sat",
                "valid",
              ].map((h, i) => (
                <th
                  key={h}
                  className={cn(
                    "px-3 py-2 text-[9px] uppercase tracking-[0.18em]",
                    i <= 1 ? "text-left" : i <= 5 ? "text-right" : "text-center"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f, i) => {
              const active = selectedFrameIndex === i;
              return (
                <tr
                  key={i}
                  onClick={() => selectFrame(active ? null : i)}
                  className={cn(
                    "cursor-pointer border-b border-[var(--line)] transition-colors",
                    active
                      ? "bg-[var(--phos-soft)] text-[var(--fg)]"
                      : "hover:bg-[var(--bg-lift)]"
                  )}
                >
                  <td className="px-3 py-1.5 text-[var(--fg-faint)]">
                    {String(f.shutter_index).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {f.t_start.toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {f.footprint_center_llh[0].toFixed(2)},
                    {f.footprint_center_llh[1].toFixed(2)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {f.off_nadir_deg.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {f.body_rate_dps.toFixed(3)}
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    {(f.wheel_max_fraction * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Gate ok={f.gate_status.smear === "pass"} />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Gate ok={f.gate_status.off_nadir === "pass"} />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Gate ok={f.gate_status.saturation === "pass"} />
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Gate ok={f.valid} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
