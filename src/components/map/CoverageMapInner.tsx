"use client";

import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { useCases } from "@/hooks/useCases";
import { useEphemeris } from "@/hooks/useEphemeris";
import { useAppStore } from "@/store/useAppStore";
import { useTimelineStore } from "@/store/useTimelineStore";
import {
  AOI_CENTER,
  DARK_TILE_ATTRIBUTION,
  DARK_TILE_URL,
  DEFAULT_MAP_ZOOM,
  TILE_STATUS_COLOR,
  TILE_STATUS_LABEL,
} from "@/lib/constants";
import type { TileInfo, EphemerisPoint } from "@/lib/types";

// Hex literals — Leaflet writes these straight into SVG `stroke`.
const PHOS = "#ffffff";
const FG_FAINT = "#6a6a6a";
const FG_MUTE = "#9a9a9a";

type IconDefaultPrototype = L.Icon.Default & { _getIconUrl?: () => string };
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;

export default function CoverageMapInner() {
  const selectedCaseId = useAppStore((s) => s.selectedCaseId);
  const selectedTileId = useAppStore((s) => s.selectedTileId);
  const selectTile = useAppStore((s) => s.selectTile);

  const { data: cases } = useCases();
  const caseConfig = cases?.find((c) => c.id === selectedCaseId);
  const { data: ephemeris } = useEphemeris(selectedCaseId);
  const result = useAppStore((s) => s.results[selectedCaseId]);
  const tiles = result?.plan?.tiles;
  const imagingWindow = result?.plan?.diagnostics.imaging_window_s;

  // Cap polyline density — Leaflet stores every vertex as an SVG path
  // segment, so dense ephemeris (>200 pts) is wasteful and a memory risk.
  const orbitTrack = useMemo(() => {
    if (!ephemeris) return [] as [number, number][];
    const pts = ephemeris.points;
    const stride = Math.max(1, Math.ceil(pts.length / 200));
    const out: [number, number][] = [];
    for (let i = 0; i < pts.length; i += stride) {
      const p = pts[i];
      if (Number.isFinite(p?.lat_deg) && Number.isFinite(p?.lon_deg)) {
        out.push([p.lat_deg, p.lon_deg]);
      }
    }
    return out;
  }, [ephemeris]);

  const insideTrack = useMemo(() => {
    if (!ephemeris || !imagingWindow) return [] as [number, number][];
    const filtered = ephemeris.points.filter(
      (p) => p.t >= imagingWindow[0] && p.t <= imagingWindow[1]
    );
    const stride = Math.max(1, Math.ceil(filtered.length / 200));
    const out: [number, number][] = [];
    for (let i = 0; i < filtered.length; i += stride) {
      const p = filtered[i];
      if (Number.isFinite(p?.lat_deg) && Number.isFinite(p?.lon_deg)) {
        out.push([p.lat_deg, p.lon_deg]);
      }
    }
    return out;
  }, [ephemeris, imagingWindow]);

  return (
    <MapContainer
      center={AOI_CENTER}
      zoom={DEFAULT_MAP_ZOOM}
      className="h-full w-full"
      attributionControl
      zoomControl
    >
      <TileLayer url={DARK_TILE_URL} attribution={DARK_TILE_ATTRIBUTION} />

      {/* Auto-fit the camera to the actual pass geometry on case change.
          Falls back to the AOI polygon alone when ephemeris hasn't loaded
          yet, then upgrades to (orbit-inside-window ∪ AOI) once it has. */}
      <FitToPass
        caseId={selectedCaseId}
        aoi={caseConfig?.aoi_polygon}
        track={insideTrack.length ? insideTrack : orbitTrack}
        closest={
          ephemeris?.closest_approach
            ? [
                ephemeris.closest_approach.lat_deg,
                ephemeris.closest_approach.lon_deg,
              ]
            : null
        }
      />

      {caseConfig && caseConfig.aoi_polygon.length > 0 && (
        <Polygon
          positions={caseConfig.aoi_polygon}
          pathOptions={{
            color: PHOS,
            weight: 1.5,
            dashArray: "4 3",
            fillColor: PHOS,
            fillOpacity: 0.06,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              AOI · {caseConfig.name}
            </span>
          </Tooltip>
        </Polygon>
      )}

      {orbitTrack.length > 0 && (
        <Polyline
          positions={orbitTrack}
          pathOptions={{
            color: FG_FAINT,
            weight: 1,
            dashArray: "2 4",
            opacity: 0.6,
          }}
        />
      )}

      {insideTrack.length > 0 && (
        <Polyline
          positions={insideTrack}
          pathOptions={{ color: FG_MUTE, weight: 2.5, opacity: 1 }}
        />
      )}

      {ephemeris?.closest_approach && (
        <CircleMarker
          center={[
            ephemeris.closest_approach.lat_deg,
            ephemeris.closest_approach.lon_deg,
          ]}
          radius={4}
          pathOptions={{
            color: PHOS,
            weight: 1.5,
            fillColor: PHOS,
            fillOpacity: 0.25,
          }}
        >
          <Tooltip>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
              CA · t={ephemeris.closest_approach.t.toFixed(0)}s · ONA{" "}
              {ephemeris.closest_approach.min_off_nadir_deg.toFixed(2)}°
            </span>
          </Tooltip>
        </CircleMarker>
      )}

      {tiles?.map((tile) => {
        if (
          !Number.isFinite(tile.center_lat) ||
          !Number.isFinite(tile.center_lon)
        ) {
          return null;
        }
        return (
          <TileMarker
            key={tile.id}
            tile={tile}
            selected={tile.id === selectedTileId}
            onClick={() =>
              selectTile(tile.id === selectedTileId ? null : tile.id)
            }
          />
        );
      })}

      {/* Satellite — imperative Leaflet marker. Mounts ONCE, then
          subscribes to currentTime and calls `marker.setLatLng()`
          directly. No React reconciliation during playback. */}
      {ephemeris && ephemeris.points.length > 0 && (
        <SatelliteMarker points={ephemeris.points} />
      )}
    </MapContainer>
  );
}

/* --------------------------------------------------------------
   Satellite — imperative. Creates one Leaflet circleMarker on
   mount, subscribes to the timeline store outside React, and
   mutates the marker's lat/lng directly. The component renders
   nothing and never re-renders.
   -------------------------------------------------------------- */
function SatelliteMarker({ points }: { points: EphemerisPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const marker = L.circleMarker([points[0].lat_deg, points[0].lon_deg], {
      radius: 6,
      color: PHOS,
      weight: 1.5,
      fillColor: PHOS,
      fillOpacity: 0.85,
    }).addTo(map);

    const last = points[points.length - 1].t;
    const first = points[0].t;
    const span = Math.max(1, last - first);

    // Pre-compute t-values to avoid per-tick allocations.
    const ts = points.map((p) => p.t);

    const update = (currentTime: number) => {
      // Binary search for the nearest index by t (not by array index).
      const target = first + Math.max(0, Math.min(span, currentTime - first));
      let lo = 0;
      let hi = ts.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (ts[mid] < target) lo = mid + 1;
        else hi = mid;
      }
      const p = points[lo];
      if (p) marker.setLatLng([p.lat_deg, p.lon_deg]);
    };

    update(useTimelineStore.getState().currentTime);
    const unsub = useTimelineStore.subscribe((s, prev) => {
      if (s.currentTime !== prev.currentTime) update(s.currentTime);
    });

    return () => {
      unsub();
      marker.remove();
    };
  }, [map, points]);

  return null;
}

function TileMarker({
  tile,
  selected,
  onClick,
}: {
  tile: TileInfo;
  selected: boolean;
  onClick: () => void;
}) {
  // Imaged tiles use a sequential ramp keyed on off-nadir (lower = brighter
  // green-white, higher = duller). Skipped/unreachable tiles render in a
  // distinct red so it's obvious which ones the planner gave up on.
  const isImaged = tile.status === "imaged";
  const isSkipped =
    tile.status === "skipped_saturation" ||
    tile.status === "skipped_time" ||
    tile.status === "unreachable";

  const color = isImaged
    ? onaToColor(tile.off_nadir_deg)
    : isSkipped
    ? "#d04a4a"
    : TILE_STATUS_COLOR[tile.status];

  if (tile.footprint && tile.footprint.length >= 3) {
    return (
      <Polygon
        positions={tile.footprint}
        eventHandlers={{ click: onClick }}
        pathOptions={{
          color,
          weight: selected ? 2 : 1,
          fillColor: color,
          fillOpacity: isImaged
            ? selected
              ? 0.55
              : 0.35
            : isSkipped
            ? selected
              ? 0.3
              : 0.18
            : 0,
          dashArray: isImaged ? undefined : "3 3",
        }}
      >
        <Tooltip>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
            {tile.id} · {TILE_STATUS_LABEL[tile.status]} · ONA{" "}
            {tile.off_nadir_deg.toFixed(1)}°
          </span>
        </Tooltip>
      </Polygon>
    );
  }

  return (
    <CircleMarker
      center={[tile.center_lat, tile.center_lon]}
      radius={selected ? 5 : 3}
      eventHandlers={{ click: onClick }}
      pathOptions={{
        color,
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.45,
      }}
    >
      <Tooltip>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}>
          {tile.id} · {TILE_STATUS_LABEL[tile.status]}
        </span>
      </Tooltip>
    </CircleMarker>
  );
}

// 0° → bright phosphor white, 60° → muted gray. Linear ramp on lightness.
function onaToColor(ona: number): string {
  const clamped = Math.max(0, Math.min(60, ona));
  const t = clamped / 60; // 0..1
  // Lightness 95% (clean white) → 55% (mid-gray)
  const l = Math.round(95 - t * 40);
  return `hsl(120 8% ${l}%)`;
}

/* --------------------------------------------------------------
   FitToPass — re-centres the camera on the actual pass geometry
   (AOI polygon + orbit track + closest approach) every time the
   selected case changes or new ephemeris arrives. Renders nothing.
   -------------------------------------------------------------- */
function FitToPass({
  caseId,
  aoi,
  track,
  closest,
}: {
  caseId: string;
  aoi?: [number, number][];
  track: [number, number][];
  closest: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    const pts: [number, number][] = [];
    if (aoi && aoi.length) pts.push(...aoi);
    if (track.length) pts.push(...track);
    if (closest) pts.push(closest);
    if (pts.length < 2) return;

    const bounds = L.latLngBounds(pts);
    if (!bounds.isValid()) return;
    map.fitBounds(bounds, {
      padding: [28, 28],
      maxZoom: 8,
      animate: false,
    });
    // Only re-fit on case change or when ephemeris first arrives — track
    // length is the cheapest stable proxy for "data ready".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, track.length, !!aoi?.length, !!closest, map]);

  return null;
}
