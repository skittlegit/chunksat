export const fmtSeconds = (s: number, decimals = 1) =>
  `${s.toFixed(decimals)}s`;

export const fmtDeg = (d: number, decimals = 2) =>
  `${d.toFixed(decimals)}°`;

export const fmtPct = (n: number, decimals = 0) =>
  `${(n * 100).toFixed(decimals)}%`;

export const fmtKm = (km: number, decimals = 1) =>
  `${km.toFixed(decimals)} km`;

export const fmtCoord = (lat: number, lon: number, decimals = 3) =>
  `${lat.toFixed(decimals)}°, ${lon.toFixed(decimals)}°`;

export const fmtMmSs = (s: number) => {
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const r = abs - m * 60;
  return `${sign}${m.toString().padStart(2, "0")}:${r.toFixed(1).padStart(4, "0")}`;
};

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
