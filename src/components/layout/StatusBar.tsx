"use client";

import { useAppStore } from "@/store/useAppStore";
import { useCases } from "@/hooks/useCases";
import { StatusDot } from "@/components/shared/StatusDot";

export function StatusBar() {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const result = useAppStore((s) => s.results[s.selectedCaseId]);
  const { isFetching: casesFetching, error: casesError } = useCases();

  // Data is static, so status reflects whether the case index loaded.
  const dataStatus = casesError
    ? ("danger" as const)
    : casesFetching
    ? ("warn" as const)
    : ("phos" as const);
  const dataLabel = casesError ? "ERROR" : casesFetching ? "LOADING" : "READY";

  const tilesValue = result?.plan
    ? `${result.plan.diagnostics.n_tiles_imaged}/${result.plan.diagnostics.n_tiles_total}`
    : "—";
  const orbitValue = result?.simulate
    ? result.simulate.score.S_orbit.toFixed(3)
    : "—";
  const lastRun = result?.ranAt
    ? new Date(result.ranAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }) + "Z"
    : "—";

  return (
    <footer className="flex h-9 shrink-0 items-stretch overflow-x-auto border-t border-[var(--line)] bg-[var(--bg)] text-[12px]">
      <Cell>
        <StatusDot status={dataStatus} pulse={dataStatus === "warn"} size={6} />
        <K>data</K>
        <V>{dataLabel}</V>
      </Cell>
      <Cell>
        <K>case</K>
        <V>{selectedCaseId === "all" ? "ALL" : selectedCaseId.toUpperCase()}</V>
      </Cell>
      <Cell className="hidden sm:flex">
        <K>tiles</K>
        <V>{tilesValue}</V>
      </Cell>
      <Cell className="hidden md:flex">
        <K>last run</K>
        <V>{lastRun}</V>
      </Cell>
      <div className="flex-1" />
      <div className="flex shrink-0 items-center gap-3 border-l border-[var(--line)] px-4 sm:px-5">
        <K>S_orbit</K>
        <span
          className="numeric text-[15px] leading-none text-[var(--phos)]"
          style={{ letterSpacing: "-0.03em" }}
        >
          {orbitValue}
        </span>
        <span className="mono hidden text-[10px] tabular-nums text-[var(--fg-faint)] sm:inline">
          / 1.350
        </span>
      </div>
    </footer>
  );
}

function Cell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "flex shrink-0 items-center gap-2 border-r border-[var(--line)] px-3 sm:px-4 " +
        (className ?? "")
      }
    >
      {children}
    </div>
  );
}
function K({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
      {children}
    </span>
  );
}
function V({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono tabular-nums text-[var(--fg)]">{children}</span>
  );
}
