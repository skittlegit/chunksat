"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useCases } from "@/hooks/useCases";
import { useEphemeris } from "@/hooks/useEphemeris";
import { useRunPass } from "@/hooks/useRunPass";
import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Module } from "@/components/shared/Module";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CoverageMap } from "@/components/map/CoverageMap";
import { ScoreCard } from "@/components/score/ScoreCard";
import { FrameTable } from "@/components/score/FrameTable";
import { PassTimeline } from "@/components/timeline/PassTimeline";
import { StrategyPicker } from "@/components/controls/StrategyPicker";
import { ParameterSliders } from "@/components/controls/ParameterSliders";
import { RunButton } from "@/components/controls/RunButton";
import { StatusDot } from "@/components/shared/StatusDot";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { cn } from "@/lib/cn";
import {
  DIFFICULTY_COLOR,
  DIFFICULTY_LABEL,
  S_ORBIT_MAX,
  WEIGHT_SCHEMES,
} from "@/lib/constants";

export default function ConsolePage() {
  const { data: cases } = useCases();
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectCase = useAppStore((s) => s.selectCase);
  const results = useAppStore((s) => s.results);
  const result = results[selectedCaseId];
  const { run, runAll, runningAllCaseId, isRunning, error } = useRunPass();
  const [framesOpen, setFramesOpen] = useState(false);

  const isOverview = selectedCaseId === "all";
  const isRunningAll = runningAllCaseId !== null;

  const activeCase = useMemo(
    () => (cases ?? []).find((c) => c.id === selectedCaseId),
    [cases, selectedCaseId]
  );

  // Real closest-approach off-nadir from the backend ephemeris — this is the
  // actual minimum off-nadir-to-AOI-center over the 720 s pass, computed by
  // the planner from SGP4 + AOI centroid. Replaces the previous hard-coded
  // estimate (which was wrong for all three cases).
  const { data: ephemeris } = useEphemeris(selectedCaseId);
  const closestOna = ephemeris?.closest_approach?.min_off_nadir_deg;

  // Mission total — weighted sum across all cases that have simulated.
  // Per planner/HANDOFF.md: hackathon weights are 0.25 / 0.35 / 0.40 (sum
  // to 1.0).
  const scheme = WEIGHT_SCHEMES.hackathon;
  const mission = useMemo(() => {
    if (!cases?.length) return null;
    const rows = cases.map((c) => {
      const r = results[c.id]?.simulate?.score?.S_orbit;
      const w = scheme.weights[c.id] ?? c.weight ?? 0;
      return {
        id: c.id,
        name: c.name,
        weight: w,
        S: typeof r === "number" && Number.isFinite(r) ? r : null,
      };
    });
    const done = rows.filter((r) => r.S !== null).length;
    const S_total = rows.reduce(
      (a, r) => a + r.weight * (r.S ?? 0),
      0
    );
    return { rows, done, total: rows.length, S_total };
  }, [cases, results, scheme]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <Navbar />

      {/* ── Dense case selector + run action header ─────────────────── */}
      <div className="shrink-0 border-b border-[var(--line)] bg-[var(--bg)]">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {/* Tabs row */}
          <div className="flex items-stretch overflow-x-auto sm:flex-1">
            <CaseTab
              active={isOverview}
              onClick={() => selectCase("all")}
              code="ALL"
              label="Overview"
            />
            {(cases ?? []).map((c, i) => (
              <CaseTab
                key={c.id}
                active={c.id === selectedCaseId}
                onClick={() => selectCase(c.id)}
                code={`C·${String(i + 1).padStart(2, "0")}`}
                label={c.name}
              />
            ))}
          </div>

          {/* Action row — always reachable */}
          {activeCase && (
            <div className="flex items-stretch border-t border-[var(--line)] sm:border-l sm:border-t-0">
              <div className="hidden items-center gap-5 px-5 sm:flex">
                <span className="mono text-[10px] tabular-nums text-[var(--fg-mute)]">
                  {new Date(activeCase.pass_start_utc)
                    .toUTCString()
                    .slice(17, 25)}
                  Z
                </span>
                <span className="mono text-[10px] tabular-nums text-[var(--fg-faint)]">
                  ONA{" "}
                  {typeof closestOna === "number"
                    ? `${closestOna.toFixed(1)}°`
                    : "—"}
                </span>
                <span className="mono text-[10px] tabular-nums text-[var(--fg-faint)]">
                  w{" "}
                  {(
                    scheme.weights[activeCase.id] ?? activeCase.weight
                  ).toFixed(2)}
                </span>
                <span
                  className="mono text-[10px]"
                  style={{ color: DIFFICULTY_COLOR[activeCase.difficulty] }}
                >
                  {DIFFICULTY_LABEL[activeCase.difficulty].toLowerCase()}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 px-4 py-2.5 sm:flex-none sm:justify-start sm:border-l sm:border-[var(--line)] sm:py-0">
                <div className="flex items-center gap-2">
                  <StatusDot
                    status={isRunning ? "warn" : "phos"}
                    pulse={isRunning}
                  />
                  <span className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-mute)]">
                    {isRunning ? "Transmitting" : "Standby"}
                  </span>
                </div>
                <RunButton
                  size="sm"
                  onClick={() => run(selectedCaseId)}
                  loading={isRunning}
                />
              </div>
            </div>
          )}

          {isOverview && (
            <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-2.5 sm:border-l sm:border-t-0 sm:py-0">
              <div className="flex items-center gap-2">
                <StatusDot
                  status={isRunningAll ? "warn" : "phos"}
                  pulse={isRunningAll}
                />
                <span className="mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-mute)]">
                  {isRunningAll
                    ? `Run ${runningAllCaseId?.toUpperCase() ?? "…"}`
                    : "All cases"}
                </span>
              </div>
              <RunButton
                size="sm"
                label="Run All"
                loadingLabel="Running…"
                onClick={() => runAll((cases ?? []).map((c) => c.id))}
                loading={isRunningAll}
                disabled={isRunning || !cases?.length}
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="shrink-0 border-b border-[var(--line)] px-4 py-2 sm:px-5">
          <ErrorState title="Pass run failed" message={error.message} />
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-5 sm:px-6">

          {/* Mission scores strip — always visible */}
          {mission && mission.rows.length > 0 && (
            <div
              className="flex flex-col overflow-hidden border border-[var(--line)] sm:flex-row"
              style={{ borderRadius: 2 }}
            >
              <div className="flex flex-1">
                {mission.rows.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => selectCase(r.id)}
                    className={cn(
                      "flex flex-1 flex-col gap-1 border-r border-[var(--line)] px-3 py-3 text-left transition-colors last:border-r-0 hover:bg-[var(--bg-lift)] sm:px-4",
                      r.id === selectedCaseId && "bg-[var(--bg-lift)]"
                    )}
                  >
                    <span className="mono text-[9px] tabular-nums tracking-[0.16em] text-[var(--fg-faint)]">
                      C·{String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="numeric tabular-nums leading-none"
                      style={{
                        fontSize: 18,
                        letterSpacing: "-0.035em",
                        color: r.S !== null ? "var(--fg)" : "var(--fg-ghost)",
                      }}
                    >
                      {r.S !== null ? r.S.toFixed(3) : "———"}
                    </span>
                    <span className="mono text-[9px] tabular-nums text-[var(--fg-faint)]">
                      ×{r.weight.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--bg-sunk)] px-4 py-2.5 sm:border-l sm:border-t-0 sm:bg-transparent sm:px-5 sm:py-3">
                <span className="eyebrow text-[var(--fg-faint)]">S_total</span>
                <span
                  className="numeric tabular-nums leading-none text-[var(--phos)]"
                  style={{ fontSize: 22, letterSpacing: "-0.04em" }}
                >
                  {mission.done === mission.total
                    ? mission.S_total.toFixed(3)
                    : "—"}
                </span>
              </div>
            </div>
          )}

          {/* Main panels */}
          {isOverview ? (
            <Module label="Mission Breakdown" hint="Score components per case">
              {/* Mobile: compact score list */}
              <div className="flex flex-col sm:hidden">
                {(cases ?? []).map((c, i) => {
                  const r = results[c.id];
                  const score = r?.simulate?.score;
                  const isActive = runningAllCaseId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectCase(c.id)}
                      className={cn(
                        "flex items-center justify-between border-b border-[var(--line)] py-3 text-left transition-colors last:border-b-0 hover:bg-[var(--bg-lift)]",
                        isActive && "bg-[var(--bg-lift)]"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <StatusDot status="warn" pulse className="shrink-0" />
                        )}
                        <span className="mono text-[10px] tabular-nums tracking-[0.16em] text-[var(--fg-faint)]">
                          C·{String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[13px] text-[var(--fg)]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className="numeric tabular-nums leading-none"
                          style={{
                            fontSize: 18,
                            letterSpacing: "-0.03em",
                            color: score ? "var(--fg)" : "var(--fg-ghost)",
                          }}
                        >
                          {score ? score.S_orbit.toFixed(3) : "———"}
                        </span>
                        <span className="mono text-[10px]">
                          {isActive ? (
                            <span style={{ color: "var(--warn)" }}>running</span>
                          ) : score ? (
                            <span style={{ color: "var(--phos)" }}>done</span>
                          ) : (
                            <span style={{ color: "var(--fg-faint)" }}>pending</span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Desktop: full breakdown table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[520px] border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--line)]">
                      {[
                        "Case",
                        "Difficulty",
                        "Pass UTC",
                        "Weight",
                        "C",
                        "η_E",
                        "η_T",
                        "Q_smear",
                        "S_orbit",
                        "/ max",
                        "Frames",
                        "Status",
                      ].map((h) => (
                        <th
                          key={h}
                          className="mono pb-2 pr-4 text-left text-[10px] uppercase tracking-[0.18em] text-[var(--fg-faint)] last:pr-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(cases ?? []).map((c, i) => {
                      const r = results[c.id];
                      const score = r?.simulate?.score;
                      const diag = r?.plan?.diagnostics;
                      const isActive = runningAllCaseId === c.id;
                      return (
                        <tr
                          key={c.id}
                          className={cn(
                            "border-b border-[var(--line)] transition-colors",
                            isActive && "bg-[var(--bg-lift)]"
                          )}
                        >
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <StatusDot
                                  status="warn"
                                  pulse
                                  className="shrink-0"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => selectCase(c.id)}
                                className="mono text-[11px] tabular-nums text-[var(--phos)] hover:underline"
                              >
                                C·{String(i + 1).padStart(2, "0")}
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className="mono text-[10px]"
                              style={{
                                color: DIFFICULTY_COLOR[c.difficulty],
                              }}
                            >
                              {DIFFICULTY_LABEL[c.difficulty].toLowerCase()}
                            </span>
                          </td>
                          <td className="mono py-2.5 pr-4 tabular-nums text-[var(--fg-mute)]">
                            {new Date(c.pass_start_utc)
                              .toUTCString()
                              .slice(17, 25)}
                            Z
                          </td>
                          <td className="mono py-2.5 pr-4 tabular-nums text-[var(--fg-mute)]">
                            {(scheme.weights[c.id] ?? c.weight).toFixed(2)}
                          </td>
                          {(
                            ["C", "eta_E", "eta_T", "Q_smear"] as const
                          ).map((k) => (
                            <td
                              key={k}
                              className="mono py-2.5 pr-4 tabular-nums text-[var(--fg-mute)]"
                            >
                              {score ? score[k].toFixed(3) : "—"}
                            </td>
                          ))}
                          <td className="mono py-2.5 pr-4 tabular-nums font-medium text-[var(--fg)]">
                            {score ? score.S_orbit.toFixed(3) : "—"}
                          </td>
                          <td className="py-2.5 pr-4">
                            {score ? (
                              <div className="flex h-1.5 w-16 overflow-hidden bg-[var(--bg-lift)]">
                                <div
                                  className="h-full bg-[var(--phos)]"
                                  style={{
                                    width: `${(
                                      Math.min(
                                        score.S_orbit / S_ORBIT_MAX,
                                        1
                                      ) * 100
                                    ).toFixed(1)}%`,
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-1.5 w-16 bg-[var(--line)]" />
                            )}
                          </td>
                          <td className="mono py-2.5 pr-4 tabular-nums text-[var(--fg-faint)]">
                            {diag && typeof diag.n_tiles_total === "number"
                              ? `${diag.n_tiles_imaged}/${diag.n_tiles_total}`
                              : "—"}
                          </td>
                          <td className="mono py-2.5 tabular-nums">
                            {isActive ? (
                              <span className="text-[var(--warn)]">
                                running
                              </span>
                            ) : score ? (
                              <span className="text-[var(--phos)]">done</span>
                            ) : (
                              <span className="text-[var(--fg-faint)]">
                                pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Module>
          ) : (
            <>
              {/* Coverage map + Score card */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_1fr]">
                <Module label="Coverage" variant="live" contentClassName="p-0">
                  <ErrorBoundary label="Coverage map">
                    <div className="relative h-[360px] w-full xl:h-[460px]">
                      <CoverageMap />
                    </div>
                  </ErrorBoundary>
                </Module>

                <Module
                  label="Score"
                  variant={result?.simulate ? "on" : "default"}
                >
                  {result?.simulate ? (
                    <ScoreCard score={result.simulate.score} />
                  ) : (
                    <div className="flex h-[260px] items-center justify-center xl:h-[440px]">
                      <LoadingState message="Awaiting simulation" />
                    </div>
                  )}
                </Module>
              </div>

              {/* Timeline */}
              <Module
                label="Timeline"
                hint="Off-nadir angle and shutter intervals"
              >
                <ErrorBoundary label="Pass timeline">
                  <PassTimeline />
                </ErrorBoundary>
              </Module>

              {/* Controls — below the readout */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Module label="Strategy">
                  <StrategyPicker />
                </Module>
                <Module label="Margins">
                  <ParameterSliders />
                </Module>
              </div>

              {/* Frames — collapsible */}
              <Module
                label="Frames"
                hint={
                  result?.simulate
                    ? `${result.simulate.per_frame.length} shutters recorded`
                    : "Awaiting simulation"
                }
                actions={
                  <button
                    type="button"
                    onClick={() => setFramesOpen((o) => !o)}
                    className="mono border border-[var(--line-bright)] bg-transparent px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--fg-mute)] transition-colors hover:border-[var(--phos)] hover:text-[var(--phos)]"
                    style={{ borderRadius: 2 }}
                  >
                    {framesOpen ? "Hide" : "Inspect"}
                  </button>
                }
              >
                {framesOpen && result?.simulate ? (
                  <FrameTable frames={result.simulate.per_frame} />
                ) : (
                  <p className="text-[12px] italic text-[var(--fg-mute)]">
                    {result?.simulate
                      ? "Click Inspect to expand the per-shutter gate table."
                      : "Run a pass to populate."}
                  </p>
                )}
              </Module>
            </>
          )}
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
function CaseTab({
  active,
  onClick,
  code,
  label,
}: {
  active: boolean;
  onClick: () => void;
  code: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex shrink-0 items-baseline gap-2.5 border-r border-[var(--line)] px-4 py-2.5 text-left transition-colors last:border-r-0 sm:px-5 sm:py-3",
        active
          ? "bg-[var(--bg-lift)] text-[var(--fg)]"
          : "text-[var(--fg-mute)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px] bg-[var(--phos)]"
        />
      )}
      <span className="mono text-[10px] tabular-nums tracking-[0.16em] text-[var(--fg-faint)]">
        {code}
      </span>
      <span className="display text-[13px]" style={{ letterSpacing: "-0.012em" }}>
        {label}
      </span>
    </button>
  );
}

