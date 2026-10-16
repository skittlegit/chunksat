"use client";

import { Navbar } from "@/components/layout/Navbar";
import { StatusBar } from "@/components/layout/StatusBar";
import { Module } from "@/components/shared/Module";
import { useAppStore } from "@/store/useAppStore";
import { useCases } from "@/hooks/useCases";
import { useRunPass } from "@/hooks/useRunPass";
import { RunButton } from "@/components/controls/RunButton";
import { StatusDot } from "@/components/shared/StatusDot";
import { S_ORBIT_MAX } from "@/lib/constants";

export default function ComparePage() {
  const { data: cases } = useCases();
  const results = useAppStore((s) => s.results);
  const { run, runAll, runningAllCaseId, isRunning } = useRunPass();

  const runAllCases = async () => {
    if (!cases) return;
    for (const c of cases) {
      try {
        await run(c.id);
      } catch (e) {
        console.error(`Failed ${c.id}:`, e);
      }
    }
  };

  const weighted = (cases ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.weight,
    score: results[c.id]?.simulate?.score ?? null,
  }));
  const allDone =
    weighted.length > 0 && weighted.every((w) => w.score != null);
  const sTotal = allDone
    ? weighted.reduce((a, w) => a + w.weight * (w.score?.S_orbit ?? 0), 0)
    : null;
  const isRunningAll = runningAllCaseId !== null;

  const SCORE_ROWS: {
    key: "C" | "eta_E" | "eta_T" | "Q_smear" | "S_orbit";
    label: string;
    sym: string;
    bold?: boolean;
  }[] = [
    { key: "S_orbit", label: "S_orbit", sym: "Score", bold: true },
    { key: "C", label: "Coverage", sym: "C" },
    { key: "eta_E", label: "Energy", sym: "η_E" },
    { key: "eta_T", label: "Time", sym: "η_T" },
    { key: "Q_smear", label: "Smear quality", sym: "Q" },
  ];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg)] text-[var(--fg)]">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-5 sm:px-6">

          {/* Page header */}
          <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-3 sm:gap-4">
              <span className="eyebrow text-[var(--fg-faint)]">Compare</span>
              <h1
                className="display-tight text-[20px] leading-[0.95] sm:text-[28px]"
                style={{ letterSpacing: "-0.04em" }}
              >
                Three passes, one weighted total.
              </h1>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
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
                label="Run All"
                loadingLabel="Running…"
                onClick={runAllCases}
                loading={isRunningAll}
                disabled={isRunning || !cases?.length}
              />
            </div>
          </header>

          {/* Comparison matrix */}
          <Module label="Comparison" hint="Score components side by side">
            {/* Mobile: per-case cards (hidden lg+) */}
            <div className="flex flex-col gap-3 lg:hidden">
              {weighted.map((w, i) => (
                <div
                  key={w.id}
                  className="border border-[var(--line)] bg-[var(--bg-sunk)]"
                  style={{ borderRadius: 2 }}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="mono text-[10px] tabular-nums tracking-[0.16em] text-[var(--fg-faint)]">
                        C·{String(i + 1).padStart(2, "0")} · ×{w.weight.toFixed(2)}
                      </span>
                      <span
                        className="display text-[15px] text-[var(--fg)]"
                        style={{ letterSpacing: "-0.015em" }}
                      >
                        {w.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => run(w.id)}
                      disabled={isRunning}
                      className="mono shrink-0 border border-[var(--line-bright)] bg-transparent px-5 text-[11px] uppercase tracking-[0.16em] text-[var(--fg-mute)] transition-colors hover:border-[var(--phos)] hover:text-[var(--phos)] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderRadius: 2, minHeight: 44 }}
                    >
                      {runningAllCaseId === w.id ? "…" : "Run"}
                    </button>
                  </div>
                  {SCORE_ROWS.map((row) => {
                    const val = w.score ? w.score[row.key] : null;
                    const num =
                      typeof val === "number" && Number.isFinite(val)
                        ? val
                        : null;
                    const max = row.key === "S_orbit" ? S_ORBIT_MAX : 1;
                    return (
                      <div
                        key={row.key}
                        className={
                          "flex items-center justify-between border-b border-[var(--line)] px-4 py-2.5 last:border-b-0" +
                          (row.bold ? " bg-[var(--bg-lift)]" : "")
                        }
                      >
                        <span
                          className={
                            row.bold
                              ? "mono text-[11px] uppercase tracking-[0.14em] text-[var(--fg)]"
                              : "text-[12px] text-[var(--fg-mute)]"
                          }
                        >
                          {row.label}
                        </span>
                        <div className="flex items-center gap-3">
                          {num !== null ? (
                            <>
                              <div className="relative h-[2px] w-12 bg-[var(--line)]">
                                <span
                                  aria-hidden
                                  className="absolute inset-y-0 left-0"
                                  style={{
                                    width: `${Math.max(0, Math.min(1, num / max)) * 100}%`,
                                    background: row.bold
                                      ? "var(--phos)"
                                      : "var(--fg-mute)",
                                  }}
                                />
                              </div>
                              <span
                                className="numeric tabular-nums leading-none"
                                style={{
                                  fontSize: row.bold ? 22 : 18,
                                  letterSpacing: "-0.04em",
                                  color: row.bold ? "var(--phos)" : "var(--fg)",
                                }}
                              >
                                {num.toFixed(3)}
                              </span>
                            </>
                          ) : (
                            <span className="mono text-[13px] text-[var(--fg-ghost)]">—</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* Desktop: unified table (hidden below lg) */}
            <div className="hidden lg:block">
              <table className="w-full border-collapse">
                {/* Column headers */}
                <thead>
                  <tr className="border-b border-[var(--line-bright)]">
                    <th className="pb-3 pr-6 text-left">
                      <span className="eyebrow">Component</span>
                    </th>
                    {weighted.map((w, i) => (
                      <th key={w.id} className="pb-3 pr-4 text-left last:pr-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="mono text-[10px] tabular-nums tracking-[0.16em] text-[var(--fg-faint)]">
                            C·{String(i + 1).padStart(2, "0")}
                          </span>
                          <span
                            className="display text-[14px] text-[var(--fg)]"
                            style={{ letterSpacing: "-0.015em" }}
                          >
                            {w.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="mono text-[10px] tabular-nums text-[var(--fg-mute)]">
                              ×{w.weight.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => run(w.id)}
                              disabled={isRunning}
                              className="mono border border-[var(--line-bright)] bg-transparent px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--fg-mute)] transition-colors hover:border-[var(--phos)] hover:text-[var(--phos)] disabled:cursor-not-allowed disabled:opacity-40"
                              style={{ borderRadius: 2, minHeight: 32 }}
                            >
                              {runningAllCaseId === w.id ? "…" : "Run"}
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {SCORE_ROWS.map((row) => (
                    <tr
                      key={row.key}
                      className={
                        "border-b border-[var(--line)] " +
                        (row.bold ? "bg-[var(--bg-sunk)]" : "")
                      }
                    >
                      <td className="py-3 pr-6">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={
                              row.bold
                                ? "mono text-[11px] uppercase tracking-[0.18em] text-[var(--fg)]"
                                : "text-[12px] text-[var(--fg-mute)]"
                            }
                          >
                            {row.label}
                          </span>
                          <span className="mono text-[9px] tabular-nums text-[var(--fg-faint)]">
                            {row.sym}
                          </span>
                        </div>
                      </td>
                      {weighted.map((w) => {
                        const val = w.score ? w.score[row.key] : null;
                        const num =
                          typeof val === "number" && Number.isFinite(val)
                            ? val
                            : null;
                        const max =
                          row.key === "S_orbit" ? S_ORBIT_MAX : 1;
                        return (
                          <td key={w.id} className="py-3 pr-4 last:pr-0">
                            {num !== null ? (
                              <div className="flex flex-col gap-1.5">
                                <span
                                  className="numeric tabular-nums leading-none"
                                  style={{
                                    fontSize: row.bold ? 28 : 22,
                                    letterSpacing: "-0.04em",
                                    color: row.bold
                                      ? "var(--phos)"
                                      : "var(--fg)",
                                  }}
                                >
                                  {num.toFixed(3)}
                                </span>
                                <div className="relative h-[2px] w-24 bg-[var(--line)]">
                                  <span
                                    aria-hidden
                                    className="absolute inset-y-0 left-0 bg-[var(--fg-mute)]"
                                    style={{
                                      width: `${Math.max(0, Math.min(1, num / max)) * 100}%`,
                                      background: row.bold
                                        ? "var(--phos)"
                                        : undefined,
                                      transition:
                                        "width 0.5s cubic-bezier(.2,.7,.2,1)",
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="mono text-[13px] text-[var(--fg-ghost)]">
                                —
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Module>

          {/* Mission total */}
          <Module label="Total" tag="S_total">
            <div className="flex flex-col gap-3">
              <code className="mono break-words text-[12px] leading-relaxed text-[var(--fg-mute)]">
                S_total ={" "}
                {weighted
                  .map(
                    (w) =>
                      `${w.weight.toFixed(2)}·${w.score?.S_orbit.toFixed(3) ?? "—"}`
                  )
                  .join("  +  ")}
              </code>
              <div className="flex items-baseline gap-4 border-t border-[var(--line)] pt-4">
                <span
                  className="numeric tabular-nums leading-none text-[var(--phos)]"
                  style={{ fontSize: 64, letterSpacing: "-0.05em" }}
                >
                  {sTotal != null ? sTotal.toFixed(3) : "—"}
                </span>
                {!allDone && (
                  <span className="text-[12px] italic text-[var(--fg-mute)]">
                    Run all 3 cases to compute total.
                  </span>
                )}
                {sTotal != null && (
                  <div className="mb-1 flex flex-col self-end text-[var(--fg-faint)]">
                    <span className="mono text-[10px] uppercase tracking-[0.18em]">
                      of {(S_ORBIT_MAX * (cases ?? []).reduce((a, c) => a + c.weight, 0)).toFixed(2)} max
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Module>
        </div>
      </main>
      <StatusBar />
    </div>
  );
}
