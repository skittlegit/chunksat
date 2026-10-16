export interface CaseConfig {
  id: string;
  name: string;
  tle_line1: string;
  tle_line2: string;
  aoi_polygon: [number, number][];
  pass_start_utc: string;
  pass_end_utc: string;
  weight: number;
  difficulty: "easy" | "moderate" | "hard";
  off_nadir_estimate_deg: number;
}

export interface EphemerisPoint {
  t: number;
  lat_deg: number;
  lon_deg: number;
  alt_km: number;
  r_eci: [number, number, number];
  v_eci: [number, number, number];
  off_nadir_to_aoi_center_deg: number;
}

export interface EphemerisResponse {
  case_id: string;
  points: EphemerisPoint[];
  closest_approach: {
    t: number;
    min_off_nadir_deg: number;
    lat_deg: number;
    lon_deg: number;
  };
}

export interface AttitudeSample {
  t: number;
  q_BN: [number, number, number, number];
}

export interface ShutterWindow {
  t_start: number;
  t_end: number;
  /** Convenience field added by api adapter: t_end - t_start. */
  duration: number;
  /** Optional polygon footprint (lon,lat) added by adapter. */
  footprint?: [number, number][];
}

export interface Schedule {
  objective?: string;
  attitude: AttitudeSample[];
  shutters: ShutterWindow[];
  notes?: string;
  target_hints_llh?: { lat_deg: number; lon_deg: number }[];
  meta?: Record<string, unknown>;
}

export type TileStatus =
  | "imaged"
  | "skipped_saturation"
  | "unreachable"
  | "skipped_time"
  | "pending";

export interface TileInfo {
  id: string;
  center_lat: number;
  center_lon: number;
  status: TileStatus;
  shutter_index?: number;
  off_nadir_deg: number;
  footprint: [number, number][] | null;
}

export interface WheelMomentumPoint {
  t: number;
  wheels: [number, number, number, number];
  max_fraction: number;
}

export interface PlanDiagnostics {
  n_tiles_total: number;
  n_tiles_imaged: number;
  estimated_coverage: number;
  estimated_score: number;
  total_slew_time_s: number;
  max_wheel_momentum_fraction: number;
  imaging_window_s: [number, number];
  closest_approach_s: number;
  // New diagnostic fields surfaced by the upgraded backend planner.
  skipped_tile_ids?: string[];
  off_nadir_limit_deg?: number;
  estimated_delta_h_used_nms?: number;
  closest_approach_off_nadir_deg?: number;
  tile_size_km?: number;
  n_tiles_skipped?: number;
}

export interface PlanResponse {
  schedule: Schedule;
  diagnostics: PlanDiagnostics;
  ephemeris_summary: {
    closest_approach_t: number;
    min_off_nadir_deg: number;
    sub_sat_lat_at_ca: number;
    sub_sat_lon_at_ca: number;
  };
  tiles: TileInfo[];
  wheel_momentum_timeline: WheelMomentumPoint[];
}

export interface FrameResult {
  shutter_index: number;
  t_start: number;
  valid: boolean;
  body_rate_dps: number;
  off_nadir_deg: number;
  wheel_max_fraction: number;
  footprint_center_llh: [number, number];
  gate_status: {
    smear: "pass" | "fail";
    off_nadir: "pass" | "fail";
    saturation: "pass" | "fail";
  };
}

export interface ScoreBreakdown {
  C: number;
  eta_E: number;
  eta_T: number;
  Q_smear: number;
  S_orbit: number;
  breakdown: string;
}

export interface SimulateResponse {
  score: ScoreBreakdown;
  per_frame: FrameResult[];
  total_score: {
    S_case1: number | null;
    S_case2: number | null;
    S_case3: number | null;
    S_total: number | null;
    note?: string;
  };
}

export type Strategy = "boustrophedon" | "greedy" | "center_first";

export interface PlanRequest {
  case_id: string;
  strategy?: Strategy;
  settle_margin_s?: number;
  off_nadir_margin_deg?: number;
}
