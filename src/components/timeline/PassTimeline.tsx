"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Pause, Play } from "lucide-react";
import { useEphemeris } from "@/hooks/useEphemeris";
import { useAppStore } from "@/store/useAppStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import {
  OFF_NADIR_LIMIT_DEG,
  PASS_DURATION_S,
} from "@/lib/constants";
import { cn } from "@/lib/cn";

// Hex literals — Recharts pipes these into SVG attrs, CSS vars don't resolve.
const FG = "#ededed";
const FG_FAINT = "#6a6a6a";
const LINE_BRIGHT = "#353535";
const PHOS = "#ffffff";
const WARN = "#9a9a9a";
const BG_LIFT = "#1c1c1c";

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: BG_LIFT,
  border: `1px solid ${LINE_BRIGHT}`,
  borderRadius: 0,
  color: FG,
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  padding: "6px 9px",
  boxShadow: "none",
};
const AXIS = {
  tick: { fill: FG_FAINT, fontSize: 10, fontFamily: "var(--font-mono)" },
  axisLine: { stroke: LINE_BRIGHT },
  tickLine: { stroke: LINE_BRIGHT },
};

/* --------------------------------------------------------------
   Imperative subscribers — these components mount ONCE and use
   `useTimelineStore.subscribe(...)` to mutate the DOM directly.
   No React re-renders happen during scrubbing or playback. This
   is the only pattern that's safe alongside Recharts/Leaflet at
   high tick rates (those libs leak SVG nodes if their parent
   re-renders 15-30×/sec).
   -------------------------------------------------------------- */

function TimeReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const write = (t: number) => {
      if (ref.current) ref.current.textContent = t.toFixed(1);
    };
    write(useTimelineStore.getState().currentTime);
    return useTimelineStore.subscribe((s, prev) => {
      if (s.currentTime !== prev.currentTime) write(s.currentTime);
    });
  }, []);
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        ref={ref}
        className="numeric leading-none text-[var(--phos)] tabular-nums"
        style={{ fontSize: 26 }}
      >
        0.0
      </span>
      <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
        s / {PASS_DURATION_S}
      </span>
    </div>
  );
}

function PlayPauseButton() {
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  return (
    <button
      type="button"
      onClick={togglePlay}
      aria-label={isPlaying ? "Pause" : "Play"}
      className="group flex h-8 w-8 items-center justify-center border border-[var(--phos)] bg-transparent text-[var(--phos)] transition-colors hover:bg-[var(--phos)] hover:text-[var(--bg)]"
      style={{ borderRadius: 2 }}
    >
      {isPlaying ? (
        <Pause size={11} fill="currentColor" />
      ) : (
        <Play size={11} fill="currentColor" className="ml-[1px]" />
      )}
    </button>
  );
}

function SpeedPicker() {
  const speed = useTimelineStore((s) => s.playbackSpeed);
  const setSpeed = useTimelineStore((s) => s.setSpeed);
  const speeds = [10, 50, 100];
  return (
    <div
      className="flex items-stretch border border-[var(--line-bright)]"
      style={{ borderRadius: 2 }}
    >
      {speeds.map((s, i) => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className={cn(
            "mono px-2.5 text-[10px] tabular-nums uppercase tracking-[0.18em] transition-colors",
            i > 0 && "border-l border-[var(--line-bright)]",
            speed === s
              ? "bg-[var(--phos)] text-[var(--bg)]"
              : "bg-transparent text-[var(--fg-mute)] hover:text-[var(--fg)]"
          )}
        >
          {s}×
        </button>
      ))}
    </div>
  );
}

function TimeScrubber() {
  const ref = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const write = (t: number) => {
      if (!draggingRef.current && el) el.value = String(t);
    };
    write(useTimelineStore.getState().currentTime);
    return useTimelineStore.subscribe((s, prev) => {
      if (s.currentTime !== prev.currentTime) write(s.currentTime);
    });
  }, []);
  return (
    <input
      ref={ref}
      type="range"
      min={0}
      max={PASS_DURATION_S}
      step={0.5}
      defaultValue={0}
      onPointerDown={() => {
        draggingRef.current = true;
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onChange={(e) =>
        useTimelineStore.getState().setTime(parseFloat(e.target.value))
      }
      className="w-full max-w-md flex-1"
    />
  );
}

/* CSS-only cursor overlay — mutates style.left imperatively. The
   underlying SVG chart is never touched. */
function CursorOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const write = (t: number) => {
      const pct = Math.max(0, Math.min(1, t / PASS_DURATION_S));
      el.style.left = `calc(40px + ${pct} * (100% - 52px))`;
    };
    write(useTimelineStore.getState().currentTime);
    return useTimelineStore.subscribe((s, prev) => {
      if (s.currentTime !== prev.currentTime) write(s.currentTime);
    });
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute"
      style={{ top: 6, bottom: 18, left: "40px" }}
    >
      <span className="block h-full w-px bg-[var(--phos)] opacity-80" />
      <span className="absolute -top-[3px] left-[-2px] block h-1.5 w-1.5 bg-[var(--phos)]" />
    </div>
  );
}

/* --------------------------------------------------------------
   Playback engine — RAF, throttled. Lives in its own subscriber so
   that turning playback on/off doesn't re-render the whole panel.
   -------------------------------------------------------------- */

function PlaybackEngine() {
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const playbackSpeed = useTimelineStore((s) => s.playbackSpeed);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    lastTickRef.current = performance.now();
    const TICK_MS = 66; // ~15 Hz — gentle on Leaflet/Recharts redraws
    const step = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000;
      if (dt * 1000 >= TICK_MS) {
        lastTickRef.current = now;
        const state = useTimelineStore.getState();
        const next = state.currentTime + dt * playbackSpeed;
        if (next >= PASS_DURATION_S) {
          state.setTime(PASS_DURATION_S);
          state.pause();
          return;
        }
        state.setTime(next);
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, playbackSpeed]);

  return null;
}

/* -------------------------------------------------------------- */

export function PassTimeline() {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const result = useAppStore((s) => s.results[selectedCaseId]);
  const { data: ephemeris } = useEphemeris(selectedCaseId);

  // Static (per-result) memos. Critically, NONE of these depend on currentTime.
  const offNadirData = useMemo(() => {
    if (!ephemeris) return [];
    const pts = ephemeris.points;
    if (!pts.length) return [];
    const stride = Math.max(1, Math.ceil(pts.length / 180));
    const out: { t: number; ona: number }[] = [];
    for (let i = 0; i < pts.length; i += stride) {
      out.push({ t: pts[i].t, ona: pts[i].off_nadir_to_aoi_center_deg });
    }
    return out;
  }, [ephemeris]);

  const shutterAreas = useMemo(() => {
    const sw = result?.plan?.schedule.shutters ?? [];
    if (!sw.length) return [];
    const sorted = [...sw].sort((a, b) => a.t_start - b.t_start);
    const merged: { x1: number; x2: number }[] = [];
    const gap = PASS_DURATION_S / 80;
    for (const s of sorted) {
      const x1 = Number(s.t_start) || 0;
      const x2 = Math.max(Number(s.t_end) || x1, x1 + 0.5);
      const last = merged[merged.length - 1];
      if (last && x1 - last.x2 <= gap) last.x2 = Math.max(last.x2, x2);
      else merged.push({ x1, x2 });
    }
    return merged.slice(0, 30);
  }, [result]);

  const window = result?.plan?.diagnostics.imaging_window_s;

  return (
    <div className="flex flex-col gap-4">
      <PlaybackEngine />

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-4">
        <PlayPauseButton />
        <TimeReadout />
        <SpeedPicker />
        <TimeScrubber />
      </div>

      <ChartFrame label="Off-nadir angle" unit="DEG">
        <ResponsiveContainer width="100%" height={170}>
          <LineChart
            data={offNadirData}
            syncId="timeline"
            margin={{ top: 6, right: 12, bottom: 4, left: 8 }}
          >
            <XAxis
              dataKey="t"
              type="number"
              domain={[0, PASS_DURATION_S]}
              {...AXIS}
            />
            <YAxis domain={[0, 75]} {...AXIS} width={32} />
            <ReferenceLine
              y={OFF_NADIR_LIMIT_DEG}
              stroke={FG_FAINT}
              strokeDasharray="2 4"
            />
            {window && (
              <ReferenceArea
                x1={window[0]}
                x2={window[1]}
                fill={PHOS}
                fillOpacity={0.05}
                stroke={PHOS}
                strokeOpacity={0.3}
              />
            )}
            {shutterAreas.map((a, i) => (
              <ReferenceArea
                key={i}
                x1={a.x1}
                x2={a.x2}
                fill={WARN}
                fillOpacity={0.14}
                stroke="none"
              />
            ))}
            <Line
              type="monotone"
              dataKey="ona"
              stroke={PHOS}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ stroke: FG_FAINT }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  );
}

function ChartFrame({
  label,
  unit,
  children,
}: {
  label: string;
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="relative flex flex-col gap-2">
      <header className="flex items-baseline justify-between">
        <span className="text-[12px] text-[var(--fg-mute)]">{label}</span>
        {unit && <span className="kbd text-[var(--fg-faint)]">{unit}</span>}
      </header>
      <div className="relative">
        {children}
        <CursorOverlay />
      </div>
    </figure>
  );
}
