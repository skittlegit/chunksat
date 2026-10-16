"use client";

import { create } from "zustand";
import type { PlanResponse, SimulateResponse, Strategy } from "@/lib/types";

interface CaseRunResult {
  plan?: PlanResponse;
  simulate?: SimulateResponse;
  ranAt?: number;
  durationMs?: number;
}

export type WeightScheme = "hackathon";

interface AppStore {
  selectedCaseId: string;
  selectedTileId: string | null;
  selectedFrameIndex: number | null;
  strategy: Strategy;
  settleMargin: number;
  offNadirMargin: number;
  weightScheme: WeightScheme;
  results: Record<string, CaseRunResult>;

  selectCase: (id: string) => void;
  selectTile: (id: string | null) => void;
  selectFrame: (i: number | null) => void;
  setStrategy: (s: Strategy) => void;
  setSettleMargin: (n: number) => void;
  setOffNadirMargin: (n: number) => void;
  setWeightScheme: (w: WeightScheme) => void;
  setCaseResult: (id: string, result: CaseRunResult) => void;
}


export const useAppStore = create<AppStore>((set) => ({
  // "all" is a sentinel meaning "no specific case picked" — the Console
  // shows the mission overview and prompts the user to pick a case before
  // any per-case panels render. Real ids are case1 / case2 / case3.
  selectedCaseId: "all",
  selectedTileId: null,
  selectedFrameIndex: null,
  strategy: "boustrophedon",
  // Backend defaults to 0.3 s; values >~1.0 push tiles outside their access
  // window and collapse coverage. Slider is clamped 0.1..1.5 to match.
  settleMargin: 0.3,
  offNadirMargin: 5.0,
  weightScheme: "hackathon",
  results: {},

  selectCase: (id) =>
    set({ selectedCaseId: id, selectedTileId: null, selectedFrameIndex: null }),
  selectTile: (id) => set({ selectedTileId: id }),
  selectFrame: (i) => set({ selectedFrameIndex: i }),
  setStrategy: (s) => set({ strategy: s }),
  setSettleMargin: (n) => set({ settleMargin: n }),
  setOffNadirMargin: (n) => set({ offNadirMargin: n }),
  setWeightScheme: (w) => set({ weightScheme: w }),
  setCaseResult: (id, result) =>
    set((s) => ({
      results: {
        ...s.results,
        [id]: { ...s.results[id], ...result },
      },
    })),
}));
