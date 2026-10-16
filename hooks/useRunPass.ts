"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api, type RunResult } from "@/lib/api";
import type { PlanRequest } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";
import { useTimelineStore } from "@/store/useTimelineStore";

/**
 * Centralised pass-run flow. Load the precomputed plan + simulate result for
 * the current controls and store it. Shared by the navbar Run button and any
 * per-case "run again" buttons.
 */
export function useRunPass() {
  const runMutation = useMutation<RunResult, Error, PlanRequest>({
    mutationFn: (params) => api.run(params),
    gcTime: 0,
  });

  const strategy = useAppStore((s) => s.strategy);
  const settleMargin = useAppStore((s) => s.settleMargin);
  const offNadirMargin = useAppStore((s) => s.offNadirMargin);
  const setCaseResult = useAppStore((s) => s.setCaseResult);

  // Tracks which case is currently running when using runAll.
  const [runningAllCaseId, setRunningAllCaseId] = useState<string | null>(null);

  const run = async (caseId: string) => {
    const start = performance.now();
    // Reset playback so a new run starts clean.
    useTimelineStore.getState().pause();
    useTimelineStore.getState().setTime(0);

    const { plan, simulate } = await runMutation.mutateAsync({
      case_id: caseId,
      strategy,
      settle_margin_s: settleMargin,
      off_nadir_margin_deg: offNadirMargin,
    });
    setCaseResult(caseId, {
      plan,
      simulate,
      ranAt: Date.now(),
      durationMs: performance.now() - start,
    });
  };

  return {
    run,
    runAll: async (caseIds: string[]) => {
      for (const caseId of caseIds) {
        setRunningAllCaseId(caseId);
        await run(caseId);
      }
      setRunningAllCaseId(null);
    },
    runningAllCaseId,
    isRunning: runMutation.isPending,
    error: runMutation.error,
    reset: runMutation.reset,
  };
}
