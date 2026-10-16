"""Precompute every plan/simulate result the chunksat console can request.

The planner is frozen and the site only exposes three cases, three strategies
and two stepped sliders, so the whole input space is finite. This script runs
each combination through the same route handlers the API serves and writes
static JSON the site loads directly, which removes the need for a live backend.

Output layout (under --out, default <repo>/public/data):

    cases.json                          same body as GET /api/cases
    ephemeris/{case}.json               same body as GET /api/cases/{case}/ephemeris
    runs/{case}/{strategy}.json         {"<settle_cs>_<ona_ds>": "<result hash>"}
    runs/{case}/r/{hash}.json           {"plan": ..., "simulate": ...}

Slider keys are integers so the browser can look them up without float
formatting issues: settle_cs = round(settle_margin_s * 100) and
ona_ds = round(off_nadir_margin_deg * 10). Identical results are stored once.

Usage (from planner/):
    .venv/Scripts/python.exe scripts/precompute.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import sys
import time
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

PLANNER_DIR = Path(__file__).resolve().parent.parent
DEFAULT_OUT = PLANNER_DIR.parent / "public" / "data"

sys.path.insert(0, str(PLANNER_DIR))

from app.data import list_cases  # noqa: E402
from app.models.requests import PlanRequest, SimulateRequest  # noqa: E402
from app.routes.cases import get_case_ephemeris  # noqa: E402
from app.routes.planning import plan  # noqa: E402
from app.routes.simulation import simulate  # noqa: E402

# Must match lib/types.ts Strategy and components/controls/ParameterSliders.tsx.
STRATEGIES = ["boustrophedon", "greedy", "center_first"]
SETTLE_CS = range(10, 151, 10)  # 0.1 .. 1.5 s, step 0.1
ONA_DS = range(0, 201, 10)  # 0 .. 20 deg, step 1


def _round(obj):
    # 7 significant digits is ~1 m on a lat/lon and well below anything the
    # UI displays, and keeps the generated files about half the size.
    if isinstance(obj, float):
        return float(f"{obj:.7g}")
    if isinstance(obj, list):
        return [_round(v) for v in obj]
    if isinstance(obj, dict):
        return {k: _round(v) for k, v in obj.items()}
    return obj


def _dumps(obj) -> str:
    return json.dumps(_round(obj), separators=(",", ":"), sort_keys=True)


def _run(job):
    case_id, strategy, settle_cs, ona_ds = job
    p = plan(
        PlanRequest(
            case_id=case_id,
            strategy=strategy,
            settle_margin_s=settle_cs / 100,
            off_nadir_margin_deg=ona_ds / 10,
        )
    ).model_dump()
    s = simulate(SimulateRequest(case_id=case_id, schedule=p["schedule"])).model_dump()
    # The UI never reads the attitude samples (~4 MB), the duplicate top-level
    # footprints, or per-shutter quaternions and tile centres; simulate has
    # already consumed the attitude.
    p["schedule"]["attitude"] = []
    p.pop("footprints", None)
    for sh in p["schedule"]["shutters"]:
        for k in ("q_BN", "tile_lat_deg", "tile_lon_deg"):
            sh.pop(k, None)
    body = _dumps({"plan": p, "simulate": s})
    digest = hashlib.sha1(body.encode()).hexdigest()[:16]
    return job, digest, body


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=DEFAULT_OUT, type=Path)
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 2))
    args = ap.parse_args()

    out: Path = args.out
    if out.exists():
        shutil.rmtree(out)
    (out / "ephemeris").mkdir(parents=True)

    cases = list_cases()
    (out / "cases.json").write_text(_dumps({"cases": cases}), encoding="utf-8")
    for c in cases:
        eph = get_case_ephemeris(c["id"])
        (out / "ephemeris" / f"{c['id']}.json").write_text(_dumps(eph), encoding="utf-8")

    jobs = [
        (c["id"], strat, sc, od)
        for c in cases
        for strat in STRATEGIES
        for sc in SETTLE_CS
        for od in ONA_DS
    ]
    indexes: dict = {}
    written: set = set()
    t0 = time.time()
    with ProcessPoolExecutor(max_workers=args.workers) as pool:
        for n, ((case_id, strat, sc, od), digest, body) in enumerate(
            pool.map(_run, jobs, chunksize=8), start=1
        ):
            indexes.setdefault((case_id, strat), {})[f"{sc}_{od}"] = digest
            if (case_id, digest) not in written:
                rdir = out / "runs" / case_id / "r"
                rdir.mkdir(parents=True, exist_ok=True)
                (rdir / f"{digest}.json").write_text(body, encoding="utf-8")
                written.add((case_id, digest))
            if n % 500 == 0 or n == len(jobs):
                print(f"{n}/{len(jobs)} runs, {len(written)} distinct, {time.time() - t0:.0f}s", flush=True)

    for (case_id, strat), index in indexes.items():
        (out / "runs" / case_id / f"{strat}.json").write_text(_dumps(index), encoding="utf-8")


if __name__ == "__main__":
    main()
