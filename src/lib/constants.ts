import type { Strategy, TileStatus } from "./types";

// ============================================================
// Pass / physics constants
// ============================================================

// Total pass length, seconds. Matches the backend's T_pass = 720 s used by
// `compute_time_efficiency` in planner/app/core/scorer.py.
export const PASS_DURATION_S = 720;
export const OFF_NADIR_LIMIT_DEG = 60;
export const BODY_RATE_LIMIT_DPS = 0.05;
export const WHEEL_LIMIT_MNMS = 30;
export const WHEEL_MARGIN_MNMS = 24;

// ============================================================
// Map
// ============================================================

export const AOI_CENTER: [number, number] = [37.5, -122.0];
export const DEFAULT_MAP_ZOOM = 6;

// Esri Dark Gray Canvas — keyless (CARTO basemaps now require an API key).
// Native tiles stop at z16; Leaflet upscales beyond that.
export const DARK_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
export const DARK_TILE_MAX_NATIVE_ZOOM = 16;
export const DARK_TILE_ATTRIBUTION = "&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors";

// ============================================================
// Palette — Monochrome
// ============================================================

export const TILE_STATUS_COLOR: Record<TileStatus, string> = {
  imaged:             "#ffffff", // full white — success
  skipped_saturation: "#9a9a9a", // mid gray
  skipped_time:       "#555555", // dim
  unreachable:        "#ededed", // near-white (rendered dashed)
  pending:            "#353535", // very dim
};

export const TILE_STATUS_LABEL: Record<TileStatus, string> = {
  imaged: "Imaged",
  skipped_saturation: "Skipped — saturation",
  skipped_time: "Skipped — time",
  unreachable: "Unreachable",
  pending: "Pending",
};

export const WHEEL_COLORS: [string, string, string, string] = [
  "#ffffff",
  "#c8c8c8",
  "#8a8a8a",
  "#555555",
];

export const DIFFICULTY_COLOR: Record<"easy" | "moderate" | "hard", string> = {
  easy:     "#ededed",
  moderate: "#9a9a9a",
  hard:     "#ffffff",
};

export const DIFFICULTY_LABEL: Record<"easy" | "moderate" | "hard", string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

// ============================================================
// Strategies
// ============================================================

interface StrategyDef {
  id: Strategy;
  label: string;
  hint: string;
}

export const STRATEGIES: StrategyDef[] = [
  {
    id: "boustrophedon",
    label: "Boustrophedon",
    hint: "Serpentine sweep — minimises slew time across rows. Recommended.",
  },
  {
    id: "greedy",
    label: "Greedy",
    hint: "Picks next-best tile by score margin. Experimental — lower coverage.",
  },
  {
    id: "center_first",
    label: "Center-First",
    hint: "Locks the centroid then expands. Experimental — lower coverage.",
  },
];

// ============================================================
// Weight schemes
// ============================================================
// Single contest weighting per planner/HANDOFF.md.
export const WEIGHT_SCHEMES: Record<
  "hackathon",
  { label: string; weights: Record<string, number> }
> = {
  hackathon: {
    label: "Hackathon",
    weights: { case1: 0.25, case2: 0.35, case3: 0.40 },
  },
};

// Per-case score upper bound for visual scaling.
// S_orbit ≤ C·(1 + 0.25·η_E + 0.10·η_T)·Q_smear ≤ 1·1.35·1 = 1.35.
export const S_ORBIT_MAX = 1.35;
